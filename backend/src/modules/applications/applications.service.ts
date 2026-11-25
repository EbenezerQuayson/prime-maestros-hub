import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApplicationStatus,
  InvoiceStatus,
  InvoiceType,
} from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateApplicationDto } from './dto/create-application.dto';

const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.PAYMENT_PENDING,
  ApplicationStatus.AWAITING_REVIEW,
  ApplicationStatus.APPROVED,
];

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateApplicationDto, ipAddress?: string) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedPhone = dto.phone.trim();

    const instrument = await this.prisma.instrument.findUnique({
      where: { id: dto.instrumentId },
      select: { id: true, name: true, slug: true, active: true },
    });

    if (!instrument || !instrument.active) {
      throw new BadRequestException('Selected instrument is not currently available');
    }

    const existingActive = await this.prisma.application.findFirst({
      where: {
        email: normalizedEmail,
        instrumentId: dto.instrumentId,
        status: { in: ACTIVE_APPLICATION_STATUSES },
      },
      select: { id: true, status: true },
    });

    if (existingActive) {
      throw new ConflictException(
        'An active application already exists for this email and instrument. Please check your application status instead.',
      );
    }

    const amountPesewas = await this.getRegistrationFeePesewas();
    const currency = this.configService.get<string>('DEFAULT_CURRENCY', 'GHS');
    const rawToken = randomBytes(24).toString('base64url');
    const applicationTokenHash = this.hashToken(rawToken);
    const invoiceNumber = this.generateInvoiceNumber();
    const now = new Date();
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { application, invoice } = await this.prisma.$transaction(
      async (tx) => {
        const createdApp = await tx.application.create({
          data: {
            applicationTokenHash,
            instrumentId: dto.instrumentId,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
            address: dto.address?.trim() || null,
            emergencyContactName: dto.emergencyContactName?.trim() || null,
            emergencyContactPhone: dto.emergencyContactPhone?.trim() || null,
            experienceLevel: dto.experienceLevel?.trim() || null,
            goals: dto.goals?.trim() || null,
            availability: dto.availability?.trim() || null,
            consentAcceptedAt: now,
            status: ApplicationStatus.PAYMENT_PENDING,
          },
        });

        const createdInvoice = await tx.invoice.create({
          data: {
            applicationId: createdApp.id,
            type: InvoiceType.REGISTRATION,
            invoiceNumber,
            amountPesewas,
            currency,
            dueDate,
            status: InvoiceStatus.PENDING,
            issuedAt: now,
          },
        });

        return { application: createdApp, invoice: createdInvoice };
      },
    );

    await this.auditService.log({
      action: 'APPLICATION_SUBMITTED',
      entityType: 'Application',
      entityId: application.id,
      metadata: {
        instrumentId: instrument.id,
        instrumentName: instrument.name,
        invoiceNumber: invoice.invoiceNumber,
        amountPesewas: invoice.amountPesewas,
      },
      ipAddress,
    });

    return {
      applicationId: application.id,
      status: application.status,
      applicationToken: rawToken,
      instrument: {
        id: instrument.id,
        name: instrument.name,
        slug: instrument.slug,
      },
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amountPesewas: invoice.amountPesewas,
        currency: invoice.currency,
        status: invoice.status,
        dueDate: invoice.dueDate,
      },
    };
  }

  async getStatus(applicationId: string, rawToken: string | undefined) {
    if (!rawToken || !rawToken.trim()) {
      throw new UnauthorizedException('Application status token is required');
    }

    const tokenHash = this.hashToken(rawToken.trim());
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        applicationTokenHash: true,
        firstName: true,
        status: true,
        decisionReason: true,
        createdAt: true,
        updatedAt: true,
        instrument: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        student: {
          select: {
            studentNumber: true,
          },
        },
        invoices: {
          where: { type: InvoiceType.REGISTRATION },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            invoiceNumber: true,
            amountPesewas: true,
            currency: true,
            status: true,
            dueDate: true,
            paidAt: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.applicationTokenHash !== tokenHash) {
      throw new UnauthorizedException('Invalid application status token');
    }

    return {
      applicationId: application.id,
      firstName: application.firstName,
      status: application.status,
      decisionReason:
        application.status === ApplicationStatus.REJECTED
          ? application.decisionReason
          : null,
      instrument: application.instrument,
      studentNumber: application.student?.studentNumber ?? null,
      registrationInvoice: application.invoices[0] ?? null,
      submittedAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  }

  private async getRegistrationFeePesewas(): Promise<number> {
    const setting = await this.prisma.academySetting.findUnique({
      where: { key: 'registration_fee_pesewas' },
      select: { value: true },
    });

    if (setting && typeof setting.value === 'number' && setting.value > 0) {
      return Math.trunc(setting.value);
    }

    const fromEnv = Number(
      this.configService.get<string>('REGISTRATION_FEE_PESEWAS', '5000'),
    );
    return Number.isFinite(fromEnv) && fromEnv > 0 ? Math.trunc(fromEnv) : 5000;
  }

  private generateInvoiceNumber(): string {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    return `PMH-REG-${y}${m}${d}-${suffix}`;
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
