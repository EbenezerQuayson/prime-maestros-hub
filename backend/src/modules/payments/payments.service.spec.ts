import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApplicationStatus,
  InvoiceStatus,
  InvoiceType,
  PaymentProvider,
  PaymentStatus,
  Role,
  UserStatus,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { HubtelGateway } from './gateways/hubtel.gateway';
import { MockPaymentGateway } from './gateways/mock-payment.gateway';
import { PaystackGateway } from './gateways/paystack.gateway';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockGateway: MockPaymentGateway;
  let prisma: {
    invoice: { findUnique: jest.Mock };
    payment: {
      create: jest.Mock;
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let auditService: { log: jest.Mock };

  const rawAppToken = 'test-application-token-123456';
  const appTokenHash = createHash('sha256').update(rawAppToken).digest('hex');

  beforeEach(() => {
    prisma = {
      invoice: { findUnique: jest.fn() },
      payment: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const configValues: Record<string, string> = {
      NODE_ENV: 'development',
      PAYMENT_PROVIDER: 'mock',
      FRONTEND_URL: 'http://localhost:3000',
      MOCK_WEBHOOK_SECRET: 'test-mock-secret',
    };
    const configService = {
      get: jest.fn((key: string, fallback?: string) => configValues[key] ?? fallback),
    } as unknown as ConfigService;

    mockGateway = new MockPaymentGateway(configService);
    const paystackGateway = new PaystackGateway(configService);
    const hubtelGateway = new HubtelGateway(configService);

    service = new PaymentsService(
      prisma as unknown as PrismaService,
      configService,
      auditService as unknown as AuditService,
      paystackGateway,
      hubtelGateway,
      mockGateway,
    );
  });

  it('initializes mock checkout for a pending registration invoice with valid applicationToken', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      invoiceNumber: 'PMH-REG-20261125-ABC123',
      type: InvoiceType.REGISTRATION,
      amountPesewas: 5000,
      currency: 'GHS',
      status: InvoiceStatus.PENDING,
      applicationId: 'app-1',
      application: {
        id: 'app-1',
        email: 'kwame@example.com',
        applicationTokenHash: appTokenHash,
      },
      student: null,
    });
    prisma.payment.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'pay-1',
        ...data,
      }),
    );

    const result = await service.initializePayment({
      invoiceId: 'inv-1',
      applicationToken: rawAppToken,
    });

    expect(result.paymentId).toBe('pay-1');
    expect(result.amountPesewas).toBe(5000);
    expect(result.authorizationUrl).toContain('http://localhost:3000/mock-checkout');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PAYMENT_INITIALIZED',
        entityId: 'pay-1',
      }),
    );
  });

  it('rejects payment initialization without valid authorization or applicationToken', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      invoiceNumber: 'PMH-REG-1',
      amountPesewas: 5000,
      currency: 'GHS',
      status: InvoiceStatus.PENDING,
      application: {
        id: 'app-1',
        email: 'kwame@example.com',
        applicationTokenHash: appTokenHash,
      },
      student: null,
    });

    await expect(
      service.initializePayment({
        invoiceId: 'inv-1',
        applicationToken: 'wrong-token',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects payment initialization when invoice is already PAID', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      status: InvoiceStatus.PAID,
      application: { applicationTokenHash: appTokenHash },
      student: null,
    });

    await expect(
      service.initializePayment({
        invoiceId: 'inv-1',
        applicationToken: rawAppToken,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects webhook with invalid signature', async () => {
    const payload = {
      event: 'charge.success',
      data: { reference: 'PMH-REF-1', amount: 5000, currency: 'GHS' },
    };
    const raw = Buffer.from(JSON.stringify(payload), 'utf8');

    await expect(
      service.handleWebhook(
        'mock',
        raw,
        { 'x-mock-signature': 'bad-signature' },
        payload,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('settles a verified mock webhook once and creates student account + PMH student number', async () => {
    const reference = 'PMH-REG-REF-1';
    mockGateway.recordSimulatedOutcome(reference, {
      status: 'SUCCESS',
      amountPesewas: 5000,
      currency: 'GHS',
      channel: 'mobile_money',
    });

    prisma.payment.findUnique
      .mockResolvedValueOnce(null) // providerEventId check
      .mockResolvedValueOnce({ id: 'pay-1', status: PaymentStatus.INITIALIZED });

    const txMock = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pay-1',
          provider: PaymentProvider.PAYSTACK,
          providerReference: reference,
          providerEventId: null,
          amountPesewas: 5000,
          currency: 'GHS',
          status: PaymentStatus.INITIALIZED,
          invoice: {
            id: 'inv-1',
            invoiceNumber: 'PMH-REG-1',
            type: InvoiceType.REGISTRATION,
            amountPesewas: 5000,
            currency: 'GHS',
            status: InvoiceStatus.PENDING,
            studentId: null,
            applicationId: 'app-1',
            student: null,
            application: {
              id: 'app-1',
              studentId: null,
              email: 'kwame@example.com',
              phone: '+233240000000',
              firstName: 'Kwame',
              lastName: 'Mensah',
              dateOfBirth: null,
              address: 'Accra',
              emergencyContactName: null,
              emergencyContactPhone: null,
              status: ApplicationStatus.PAYMENT_PENDING,
            },
          },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          role: Role.STUDENT,
          status: UserStatus.INVITED,
        }),
      },
      studentNumberCounter: {
        upsert: jest.fn().mockResolvedValue({ year: 2026, lastSequence: 1 }),
      },
      student: {
        create: jest.fn().mockResolvedValue({
          id: 'stu-1',
          studentNumber: 'PMH-2026-0001',
        }),
      },
      authToken: { create: jest.fn().mockResolvedValue({}) },
      notification: { create: jest.fn().mockResolvedValue({}) },
      application: { update: jest.fn().mockResolvedValue({}) },
      invoice: { update: jest.fn().mockResolvedValue({}) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };

    prisma.$transaction.mockImplementation(
      async (cb: (tx: typeof txMock) => unknown) => cb(txMock),
    );

    const payload = {
      event: 'charge.success',
      eventId: 'mock:evt:1',
      data: { reference, amount: 5000, currency: 'GHS', channel: 'mobile_money' },
    };
    const rawStr = JSON.stringify(payload);
    const sig = mockGateway.signMockPayload(rawStr);

    const result = await service.handleWebhook(
      'mock',
      Buffer.from(rawStr, 'utf8'),
      { 'x-mock-signature': sig },
      payload,
    );

    expect(result).toEqual(
      expect.objectContaining({
        received: true,
        status: PaymentStatus.SUCCESS,
        invoiceStatus: InvoiceStatus.PAID,
        studentNumber: 'PMH-2026-0001',
        idempotent: false,
      }),
    );
    expect(txMock.student.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ studentNumber: 'PMH-2026-0001' }),
      }),
    );
    expect(txMock.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: ApplicationStatus.AWAITING_REVIEW }),
      }),
    );
  });

  it('rejects settlement if verified amount does not match invoice amount', async () => {
    const reference = 'PMH-REG-REF-SHORT';
    mockGateway.recordSimulatedOutcome(reference, {
      status: 'SUCCESS',
      amountPesewas: 1000,
      currency: 'GHS',
    });

    prisma.payment.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'pay-2', status: PaymentStatus.INITIALIZED });

    const txMock = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pay-2',
          providerReference: reference,
          amountPesewas: 5000,
          currency: 'GHS',
          status: PaymentStatus.INITIALIZED,
          invoice: {
            id: 'inv-2',
            amountPesewas: 5000,
            currency: 'GHS',
            status: InvoiceStatus.PENDING,
            student: null,
            application: null,
          },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };

    prisma.$transaction.mockImplementation(
      async (cb: (tx: typeof txMock) => unknown) => cb(txMock),
    );

    const payload = {
      event: 'charge.success',
      eventId: 'mock:evt:2',
      data: { reference, amount: 1000, currency: 'GHS' },
    };
    const rawStr = JSON.stringify(payload);
    const sig = mockGateway.signMockPayload(rawStr);

    await expect(
      service.handleWebhook(
        'mock',
        Buffer.from(rawStr, 'utf8'),
        { 'x-mock-signature': sig },
        payload,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
