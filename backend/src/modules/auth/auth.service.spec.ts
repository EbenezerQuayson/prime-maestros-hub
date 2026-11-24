import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    refreshToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };
  let auditService: { log: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-access-jwt'),
    };
    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };
    const configService = {
      get: jest.fn().mockReturnValue('7'),
    } as unknown as ConfigService;

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService,
      auditService as unknown as AuditService,
    );
  });

  it('signs in an active user with valid credentials and logs an audit entry', async () => {
    const passwordHash = await bcrypt.hash('ValidPassword123!', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@primemaestros.local',
      passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    });
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });
    prisma.user.update.mockResolvedValue({});

    const result = await service.login(
      ' Admin@PrimeMaestros.local ',
      'ValidPassword123!',
      { ipAddress: '127.0.0.1' },
    );

    expect(result.accessToken).toBe('signed-access-jwt');
    expect(result.refreshToken).toBeTruthy();
    expect(result.user.email).toBe('admin@primemaestros.local');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'user-1',
        action: 'AUTH_LOGIN',
      }),
    );
  });

  it('rejects login when user is still INVITED', async () => {
    const passwordHash = await bcrypt.hash('ValidPassword123!', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      email: 'student@primemaestros.local',
      passwordHash,
      role: Role.STUDENT,
      status: UserStatus.INVITED,
    });

    await expect(
      service.login('student@primemaestros.local', 'ValidPassword123!'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('revokes all active tokens if a revoked refresh token is replayed', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-old',
      userId: 'user-1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'user-1',
        email: 'admin@primemaestros.local',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.refresh('replayed-token')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
