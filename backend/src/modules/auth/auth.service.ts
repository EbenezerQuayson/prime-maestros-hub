import {
  BadRequestException,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenType, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

const BCRYPT_ROUNDS = 12;

export interface AuthSessionResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: Role;
    status: UserStatus;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  async login(
    email: string,
    password: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthSessionResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        `Account is ${user.status.toLowerCase()}. Please activate or contact an administrator.`,
      );
    }

    const session = await this.issueSessionTokens(user, meta);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'AUTH_LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress: meta?.ipAddress,
    });

    return session;
  }

  async refresh(
    rawRefreshToken: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthSessionResult> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Reuse detection: if a previously revoked token is replayed, revoke all user sessions
    if (stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (stored.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (stored.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    const newRawRefresh = randomBytes(48).toString('base64url');
    const newHash = this.hashToken(newRawRefresh);
    const expiresAt = this.computeRefreshExpiry();

    await this.prisma.$transaction(async (tx) => {
      const created = await tx.refreshToken.create({
        data: {
          userId: stored.userId,
          tokenHash: newHash,
          expiresAt,
          ipAddress: meta?.ipAddress ?? null,
          userAgent: meta?.userAgent ?? null,
        },
      });

      await tx.refreshToken.update({
        where: { id: stored.id },
        data: {
          revokedAt: new Date(),
          replacedByTokenId: created.id,
        },
      });
    });

    const accessToken = await this.signAccessToken(stored.user);

    return {
      accessToken,
      refreshToken: newRawRefresh,
      user: {
        id: stored.user.id,
        email: stored.user.email,
        role: stored.user.role,
        status: stored.user.status,
      },
    };
  }

  async logout(
    rawRefreshToken: string | undefined,
    actorUserId?: string,
    ipAddress?: string,
  ): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    if (actorUserId) {
      await this.auditService.log({
        actorUserId,
        action: 'AUTH_LOGOUT',
        entityType: 'User',
        entityId: actorUserId,
        ipAddress,
      });
    }
  }

  async activateAccount(
    rawToken: string,
    password: string,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const tokenHash = this.hashToken(rawToken);
    const authToken = await this.prisma.authToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !authToken ||
      authToken.type !== AuthTokenType.ACTIVATION ||
      authToken.usedAt ||
      authToken.expiresAt <= new Date()
    ) {
      throw new BadRequestException('Invalid or expired activation token');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: authToken.userId },
        data: {
          passwordHash,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: authToken.user.emailVerifiedAt ?? now,
        },
      }),
      this.prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: now },
      }),
    ]);

    await this.auditService.log({
      actorUserId: authToken.userId,
      action: 'AUTH_ACCOUNT_ACTIVATED',
      entityType: 'User',
      entityId: authToken.userId,
      ipAddress,
    });

    return { message: 'Account activated successfully. You may now sign in.' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, status: true },
    });

    if (user && user.status === UserStatus.ACTIVE) {
      const rawToken = randomBytes(32).toString('base64url');
      const tokenHash = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.prisma.authToken.create({
        data: {
          userId: user.id,
          type: AuthTokenType.PASSWORD_RESET,
          tokenHash,
          expiresAt,
        },
      });

      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      );
      const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

      if (this.notificationsService) {
        await this.notificationsService.sendEmail({
          userId: user.id,
          to: normalizedEmail,
          type: 'PASSWORD_RESET',
          subject: 'Prime Maestros Hub — Password Reset Request',
          content: `Reset your Prime Maestros Hub password using this link (valid for 1 hour): ${resetUrl}`,
          devLogNote: `Password reset URL for ${normalizedEmail}: ${resetUrl}`,
        });
      }
    }

    return {
      message:
        'If an active account exists for that email, a password reset link has been queued.',
    };
  }

  async resendActivation(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        status: true,
        student: { select: { studentNumber: true } },
      },
    });

    if (user && user.status === UserStatus.INVITED) {
      const rawToken = randomBytes(32).toString('base64url');
      const tokenHash = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await this.prisma.authToken.create({
        data: {
          userId: user.id,
          type: AuthTokenType.ACTIVATION,
          tokenHash,
          expiresAt,
        },
      });

      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      );
      const activateUrl = `${frontendUrl}/activate?token=${encodeURIComponent(rawToken)}`;

      if (this.notificationsService) {
        await this.notificationsService.sendEmail({
          userId: user.id,
          to: normalizedEmail,
          type: 'ACCOUNT_ACTIVATION',
          subject: 'Prime Maestros Hub — Activate Your Student Account',
          content: `Activate your Prime Maestros Hub account${user.student?.studentNumber ? ` (${user.student.studentNumber})` : ''} using this link (valid for 48 hours): ${activateUrl}`,
          devLogNote: `Activation URL for ${normalizedEmail}: ${activateUrl}`,
        });
      }
    }

    return {
      message:
        'If an invited account exists for that email, a fresh activation link has been queued.',
    };
  }

  async resetPassword(
    rawToken: string,
    newPassword: string,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const tokenHash = this.hashToken(rawToken);
    const authToken = await this.prisma.authToken.findUnique({
      where: { tokenHash },
    });

    if (
      !authToken ||
      authToken.type !== AuthTokenType.PASSWORD_RESET ||
      authToken.usedAt ||
      authToken.expiresAt <= new Date()
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: authToken.userId },
        data: { passwordHash },
      }),
      this.prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: now },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: authToken.userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    await this.auditService.log({
      actorUserId: authToken.userId,
      action: 'AUTH_PASSWORD_RESET',
      entityType: 'User',
      entityId: authToken.userId,
      ipAddress,
    });

    return { message: 'Password reset successfully.' };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        mfaEnabled: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        student: {
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employmentStatus: true,
          },
        },
      },
    });
  }

  private async issueSessionTokens(
    user: { id: string; email: string; role: Role; status: UserStatus },
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthSessionResult> {
    const rawRefreshToken = randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(rawRefreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: this.computeRefreshExpiry(),
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
      },
    });

    const accessToken = await this.signAccessToken(user);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }

  private signAccessToken(user: {
    id: string;
    email: string;
    role: Role;
  }): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private computeRefreshExpiry(): Date {
    const days = Number(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_DAYS') || '7',
    );
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
