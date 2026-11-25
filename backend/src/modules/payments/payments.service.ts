import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApplicationStatus,
  AuthTokenType,
  InvoiceStatus,
  InvoiceType,
  NotificationChannel,
  NotificationStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  Role,
  UserStatus,
} from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { SimulateMockPaymentDto } from './dto/simulate-mock-payment.dto';
import { HubtelGateway } from './gateways/hubtel.gateway';
import { MockPaymentGateway } from './gateways/mock-payment.gateway';
import {
  PaymentGatewayAdapter,
  VerifiedTransactionResult,
} from './gateways/payment-gateway.interface';
import { PaystackGateway } from './gateways/paystack.gateway';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly paystackGateway: PaystackGateway,
    private readonly hubtelGateway: HubtelGateway,
    private readonly mockGateway: MockPaymentGateway,
  ) {}

  async initializePayment(
    dto: InitializePaymentDto,
    actorUser?: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: {
        application: true,
        student: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    this.assertInvoiceAccess(invoice, actorUser, dto.applicationToken);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new ConflictException('Invoice is already paid');
    }

    if (
      invoice.status === InvoiceStatus.VOID ||
      invoice.status === InvoiceStatus.CANCELLED ||
      invoice.status === InvoiceStatus.EXPIRED
    ) {
      throw new BadRequestException('Invoice is no longer payable');
    }

    const email = invoice.application?.email || invoice.student?.email;
    if (!email) {
      throw new BadRequestException(
        'Cannot initialize checkout without a customer email',
      );
    }

    const selectedMode =
      dto.provider ||
      this.configService.get<string>('PAYMENT_PROVIDER', 'mock').toLowerCase();
    const gateway = this.resolveGateway(selectedMode);

    const reference = `PMH-${invoice.invoiceNumber}-${randomBytes(4)
      .toString('hex')
      .toUpperCase()}`;

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const returnParams = new URLSearchParams({ reference });
    if (invoice.applicationId) {
      returnParams.set('applicationId', invoice.applicationId);
    }
    const callbackUrl = `${frontendUrl}/payment-return?${returnParams.toString()}`;

    const checkout = await gateway.initializeCheckout({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      reference,
      amountPesewas: invoice.amountPesewas,
      currency: invoice.currency,
      email,
      callbackUrl,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: invoice.type,
        applicationId: invoice.applicationId,
      },
    });

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        provider: gateway.provider,
        providerReference: checkout.providerReference,
        amountPesewas: invoice.amountPesewas,
        currency: invoice.currency,
        status: PaymentStatus.INITIALIZED,
        rawPayload: (checkout.rawPayload ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });

    await this.auditService.log({
      actorUserId: actorUser?.id,
      action: 'PAYMENT_INITIALIZED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        provider: selectedMode,
        providerReference: payment.providerReference,
      },
      ipAddress,
    });

    return {
      paymentId: payment.id,
      provider: selectedMode,
      providerReference: payment.providerReference,
      authorizationUrl: checkout.authorizationUrl,
      amountPesewas: payment.amountPesewas,
      currency: payment.currency,
      status: payment.status,
    };
  }

  async getPayment(
    paymentId: string,
    actorUser?: AuthenticatedUser,
    applicationToken?: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            application: {
              select: {
                id: true,
                applicationTokenHash: true,
                status: true,
                student: { select: { studentNumber: true } },
              },
            },
            student: { select: { id: true, userId: true, studentNumber: true } },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    this.assertInvoiceAccess(payment.invoice, actorUser, applicationToken);

    return {
      id: payment.id,
      provider: payment.provider,
      providerReference: payment.providerReference,
      amountPesewas: payment.amountPesewas,
      currency: payment.currency,
      channel: payment.channel,
      status: payment.status,
      paidAt: payment.paidAt,
      invoice: {
        id: payment.invoice.id,
        invoiceNumber: payment.invoice.invoiceNumber,
        type: payment.invoice.type,
        status: payment.invoice.status,
        paidAt: payment.invoice.paidAt,
      },
      applicationStatus: payment.invoice.application?.status ?? null,
      studentNumber:
        payment.invoice.student?.studentNumber ??
        payment.invoice.application?.student?.studentNumber ??
        null,
    };
  }

  async verifyByReference(
    providerReference: string,
    actorUser?: AuthenticatedUser,
    applicationToken?: string,
    ipAddress?: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerReference },
      include: {
        invoice: {
          include: {
            application: true,
            student: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment reference not found');
    }

    this.assertInvoiceAccess(payment.invoice, actorUser, applicationToken);

    if (payment.status === PaymentStatus.SUCCESS) {
      return {
        providerReference: payment.providerReference,
        status: payment.status,
        invoiceStatus: payment.invoice.status,
        studentNumber: payment.invoice.student?.studentNumber ?? null,
        idempotent: true,
      };
    }

    const gateway = this.resolveGatewayForPayment(payment);
    const verified = await gateway.verifyTransaction(providerReference);
    return this.applyVerifiedOutcome(payment.id, verified, undefined, ipAddress);
  }

  async handleWebhook(
    providerParam: string,
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
    payload: Record<string, unknown>,
    ipAddress?: string,
  ) {
    const normalizedProvider = providerParam.toLowerCase();
    if (
      normalizedProvider === 'mock' &&
      this.configService.get<string>('NODE_ENV') === 'production'
    ) {
      throw new NotFoundException('Mock webhook endpoint disabled in production');
    }

    const gateway = this.resolveGateway(normalizedProvider);
    const validSignature = gateway.verifyWebhookSignature(rawBody, headers);
    if (!validSignature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = gateway.parseWebhookEvent(payload);
    if (!event) {
      return { received: true, ignored: true };
    }

    if (event.eventId) {
      const existingEvent = await this.prisma.payment.findUnique({
        where: { providerEventId: event.eventId },
        select: { id: true, status: true },
      });
      if (existingEvent) {
        return { received: true, idempotent: true, status: existingEvent.status };
      }
    }

    const payment = await this.prisma.payment.findUnique({
      where: { providerReference: event.providerReference },
      select: { id: true, status: true },
    });

    if (!payment) {
      this.logger.warn(
        `Webhook received for unknown reference: ${event.providerReference}`,
      );
      return { received: true, ignored: true };
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return { received: true, idempotent: true, status: PaymentStatus.SUCCESS };
    }

    // Server-to-server verification (FR-05): never rely solely on webhook body
    const verified = await gateway.verifyTransaction(event.providerReference);
    const result = await this.applyVerifiedOutcome(
      payment.id,
      verified,
      event.eventId,
      ipAddress,
    );

    return {
      received: true,
      ...result,
    };
  }

  async simulateMockPayment(dto: SimulateMockPaymentDto, ipAddress?: string) {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new NotFoundException('Mock simulator is disabled in production');
    }
    const configured = this.configService
      .get<string>('PAYMENT_PROVIDER', 'mock')
      .toLowerCase();
    if (configured !== 'mock') {
      throw new BadRequestException(
        'Mock payment simulation is only available when PAYMENT_PROVIDER=mock',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: { providerReference: dto.reference },
      select: {
        id: true,
        amountPesewas: true,
        currency: true,
        providerReference: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment reference not found');
    }

    this.mockGateway.recordSimulatedOutcome(payment.providerReference, {
      status: dto.outcome,
      amountPesewas: payment.amountPesewas,
      currency: payment.currency,
      channel: dto.channel || 'mobile_money',
    });

    const eventType =
      dto.outcome === 'SUCCESS'
        ? 'charge.success'
        : dto.outcome === 'FAILED'
          ? 'charge.failed'
          : 'charge.abandoned';

    const webhookBody = {
      event: eventType,
      eventId: `mock:${eventType}:${payment.providerReference}:${Date.now()}`,
      data: {
        reference: payment.providerReference,
        amount: payment.amountPesewas,
        currency: payment.currency,
        channel: dto.channel || 'mobile_money',
      },
    };
    const rawJson = JSON.stringify(webhookBody);
    const signature = this.mockGateway.signMockPayload(rawJson);

    return this.handleWebhook(
      'mock',
      Buffer.from(rawJson, 'utf8'),
      { 'x-mock-signature': signature },
      webhookBody,
      ipAddress,
    );
  }

  private async applyVerifiedOutcome(
    paymentId: string,
    verified: VerifiedTransactionResult,
    providerEventId?: string,
    ipAddress?: string,
  ) {
    const outcome = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          invoice: {
            include: {
              application: true,
              student: true,
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (
        payment.status === PaymentStatus.SUCCESS ||
        payment.invoice.status === InvoiceStatus.PAID
      ) {
        return {
          providerReference: payment.providerReference,
          status: PaymentStatus.SUCCESS,
          invoiceStatus: InvoiceStatus.PAID,
          studentNumber: payment.invoice.student?.studentNumber ?? null,
          idempotent: true,
        };
      }

      if (verified.status !== 'SUCCESS') {
        const mappedStatus =
          verified.status === 'FAILED'
            ? PaymentStatus.FAILED
            : verified.status === 'ABANDONED'
              ? PaymentStatus.ABANDONED
              : PaymentStatus.PENDING;

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: mappedStatus,
            channel: verified.channel ?? payment.channel,
            providerEventId: providerEventId ?? payment.providerEventId,
            rawPayload: (verified.rawPayload ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
          },
        });

        return {
          providerReference: payment.providerReference,
          status: mappedStatus,
          invoiceStatus: payment.invoice.status,
          studentNumber: null,
          idempotent: false,
        };
      }

      if (
        verified.amountPesewas !== payment.invoice.amountPesewas ||
        verified.currency.toUpperCase() !==
          payment.invoice.currency.toUpperCase()
      ) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            rawPayload: (verified.rawPayload ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
          },
        });

        await tx.auditLog.create({
          data: {
            action: 'PAYMENT_AMOUNT_MISMATCH',
            entityType: 'Payment',
            entityId: payment.id,
            ipAddress: ipAddress ?? null,
            metadata: {
              expectedPesewas: payment.invoice.amountPesewas,
              verifiedPesewas: verified.amountPesewas,
              expectedCurrency: payment.invoice.currency,
              verifiedCurrency: verified.currency,
            },
          },
        });

        throw new BadRequestException(
          'Verified payment amount or currency does not match invoice',
        );
      }

      const paidAt = verified.paidAt || new Date();

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          paidAt,
          channel: verified.channel ?? payment.channel,
          providerEventId: providerEventId ?? payment.providerEventId,
          rawPayload: (verified.rawPayload ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
        },
      });

      let linkedStudentId = payment.invoice.studentId;
      let studentNumber = payment.invoice.student?.studentNumber ?? null;

      if (
        payment.invoice.type === InvoiceType.REGISTRATION &&
        payment.invoice.application
      ) {
        const app = payment.invoice.application;

        if (!linkedStudentId) {
          if (app.studentId) {
            const existingStudent = await tx.student.findUnique({
              where: { id: app.studentId },
              select: { id: true, studentNumber: true },
            });
            if (existingStudent) {
              linkedStudentId = existingStudent.id;
              studentNumber = existingStudent.studentNumber;
            }
          } else {
            const existingUser = await tx.user.findUnique({
              where: { email: app.email.trim().toLowerCase() },
              include: { student: true },
            });

            if (existingUser?.student) {
              linkedStudentId = existingUser.student.id;
              studentNumber = existingUser.student.studentNumber;
            } else {
              const year = paidAt.getUTCFullYear();
              const counter = await tx.studentNumberCounter.upsert({
                where: { year },
                create: { year, lastSequence: 1 },
                update: { lastSequence: { increment: 1 } },
              });
              studentNumber = `PMH-${year}-${String(counter.lastSequence).padStart(4, '0')}`;

              const user =
                existingUser ??
                (await tx.user.create({
                  data: {
                    email: app.email.trim().toLowerCase(),
                    phone: app.phone,
                    role: Role.STUDENT,
                    status: UserStatus.INVITED,
                  },
                }));

              const createdStudent = await tx.student.create({
                data: {
                  userId: user.id,
                  studentNumber,
                  firstName: app.firstName,
                  lastName: app.lastName,
                  dateOfBirth: app.dateOfBirth,
                  phone: app.phone,
                  email: app.email,
                  address: app.address,
                  emergencyContactName: app.emergencyContactName,
                  emergencyContactPhone: app.emergencyContactPhone,
                },
              });

              linkedStudentId = createdStudent.id;

              const rawActivationToken = randomBytes(32).toString('base64url');
              const activationHash = this.hashToken(rawActivationToken);
              await tx.authToken.create({
                data: {
                  userId: user.id,
                  type: AuthTokenType.ACTIVATION,
                  tokenHash: activationHash,
                  expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
                },
              });

              await tx.notification.create({
                data: {
                  userId: user.id,
                  channel: NotificationChannel.EMAIL,
                  type: 'ACCOUNT_ACTIVATION',
                  subject: 'Prime Maestros Hub — Payment Confirmed & Activate Account',
                  content: `Your GH₵50 registration payment is confirmed and your student number is ${studentNumber}. Please activate your account using your secure activation link.`,
                  status: NotificationStatus.PENDING,
                },
              });
            }
          }
        }

        if (
          app.status === ApplicationStatus.PAYMENT_PENDING ||
          app.status === ApplicationStatus.DRAFT
        ) {
          await tx.application.update({
            where: { id: app.id },
            data: {
              studentId: linkedStudentId,
              status: ApplicationStatus.AWAITING_REVIEW,
            },
          });
        }
      }

      await tx.invoice.update({
        where: { id: payment.invoice.id },
        data: {
          status: InvoiceStatus.PAID,
          paidAt,
          studentId: linkedStudentId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'PAYMENT_SETTLED',
          entityType: 'Payment',
          entityId: payment.id,
          ipAddress: ipAddress ?? null,
          metadata: {
            invoiceId: payment.invoice.id,
            invoiceNumber: payment.invoice.invoiceNumber,
            providerReference: payment.providerReference,
            amountPesewas: payment.amountPesewas,
            studentNumber,
          },
        },
      });

      return {
        providerReference: payment.providerReference,
        status: PaymentStatus.SUCCESS,
        invoiceStatus: InvoiceStatus.PAID,
        studentNumber,
        idempotent: false,
      };
    });

    return outcome;
  }

  private assertInvoiceAccess(
    invoice: {
      student?: { userId: string } | null;
      application?: { applicationTokenHash: string } | null;
    },
    actorUser?: AuthenticatedUser,
    applicationToken?: string,
  ) {
    if (
      actorUser &&
      (actorUser.role === Role.SUPER_ADMIN || actorUser.role === Role.ADMIN)
    ) {
      return;
    }

    if (
      actorUser &&
      invoice.student &&
      invoice.student.userId === actorUser.id
    ) {
      return;
    }

    if (
      applicationToken &&
      invoice.application &&
      this.hashToken(applicationToken.trim()) ===
        invoice.application.applicationTokenHash
    ) {
      return;
    }

    throw new ForbiddenException(
      'You are not authorized to access or pay this invoice',
    );
  }

  private resolveGateway(provider: string): PaymentGatewayAdapter {
    switch (provider.toLowerCase()) {
      case 'mock':
        return this.mockGateway;
      case 'paystack':
        return this.paystackGateway;
      case 'hubtel':
        return this.hubtelGateway;
      default:
        throw new BadRequestException(`Unsupported payment provider: ${provider}`);
    }
  }

  private resolveGatewayForPayment(payment: {
    provider: PaymentProvider;
    rawPayload: Prisma.JsonValue | null;
  }): PaymentGatewayAdapter {
    const raw =
      payment.rawPayload && typeof payment.rawPayload === 'object'
        ? (payment.rawPayload as Record<string, unknown>)
        : null;
    if (raw?.mode === 'mock') {
      return this.mockGateway;
    }
    return payment.provider === PaymentProvider.HUBTEL
      ? this.hubtelGateway
      : this.paystackGateway;
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
