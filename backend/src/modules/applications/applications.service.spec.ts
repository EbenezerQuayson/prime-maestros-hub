import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationStatus, InvoiceStatus, InvoiceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApplicationsService } from './applications.service';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: {
    instrument: { findUnique: jest.Mock };
    application: { findFirst: jest.Mock; findUnique: jest.Mock };
    academySetting: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let auditService: { log: jest.Mock };

  beforeEach(() => {
    prisma = {
      instrument: { findUnique: jest.fn() },
      application: { findFirst: jest.fn(), findUnique: jest.fn() },
      academySetting: { findUnique: jest.fn().mockResolvedValue({ value: 5000 }) },
      $transaction: jest.fn(),
    };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };
    const configService = {
      get: jest.fn((_k: string, fallback?: string) => fallback),
    } as unknown as ConfigService;

    service = new ApplicationsService(
      prisma as unknown as PrismaService,
      configService,
      auditService as unknown as AuditService,
    );
  });

  it('creates an application in PAYMENT_PENDING and a GH₵50 registration invoice', async () => {
    prisma.instrument.findUnique.mockResolvedValue({
      id: 'inst-1',
      name: 'Acoustic Guitar',
      slug: 'acoustic-guitar',
      active: true,
    });
    prisma.application.findFirst.mockResolvedValue(null);

    const txMock = {
      application: {
        create: jest.fn().mockResolvedValue({
          id: 'app-1',
          status: ApplicationStatus.PAYMENT_PENDING,
        }),
      },
      invoice: {
        create: jest.fn().mockResolvedValue({
          id: 'inv-1',
          invoiceNumber: 'PMH-REG-20261125-ABCDEF',
          amountPesewas: 5000,
          currency: 'GHS',
          status: InvoiceStatus.PENDING,
          dueDate: new Date(),
        }),
      },
    };
    prisma.$transaction.mockImplementation(
      async (cb: (tx: typeof txMock) => unknown) => cb(txMock),
    );

    const result = await service.create(
      {
        firstName: 'Kwame',
        lastName: 'Mensah',
        email: ' Kwame@Example.com ',
        phone: '+233 24 123 4567',
        instrumentId: 'inst-1',
        experienceLevel: 'Beginner',
        goals: 'Learn chord progressions',
        availability: 'Saturday mornings',
        consentAccepted: true,
      },
      '127.0.0.1',
    );

    expect(result.applicationId).toBe('app-1');
    expect(result.status).toBe(ApplicationStatus.PAYMENT_PENDING);
    expect(result.applicationToken).toBeTruthy();
    expect(result.invoice.amountPesewas).toBe(5000);
    expect(result.invoice.currency).toBe('GHS');
    expect(txMock.application.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'kwame@example.com',
          status: ApplicationStatus.PAYMENT_PENDING,
        }),
      }),
    );
    expect(txMock.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: InvoiceType.REGISTRATION,
          amountPesewas: 5000,
        }),
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'APPLICATION_SUBMITTED',
        entityId: 'app-1',
      }),
    );
  });

  it('rejects duplicate active application for same email and instrument', async () => {
    prisma.instrument.findUnique.mockResolvedValue({
      id: 'inst-1',
      name: 'Acoustic Guitar',
      slug: 'acoustic-guitar',
      active: true,
    });
    prisma.application.findFirst.mockResolvedValue({
      id: 'app-existing',
      status: ApplicationStatus.PAYMENT_PENDING,
    });

    await expect(
      service.create({
        firstName: 'Kwame',
        lastName: 'Mensah',
        email: 'kwame@example.com',
        phone: '+233 24 123 4567',
        instrumentId: 'inst-1',
        consentAccepted: true,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects inactive or unknown instruments', async () => {
    prisma.instrument.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        firstName: 'Kwame',
        lastName: 'Mensah',
        email: 'kwame@example.com',
        phone: '+233 24 123 4567',
        instrumentId: 'inst-missing',
        consentAccepted: true,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('requires a valid token to read application status', async () => {
    await expect(service.getStatus('app-1', undefined)).rejects.toThrow(
      UnauthorizedException,
    );

    prisma.application.findUnique.mockResolvedValue({
      id: 'app-1',
      applicationTokenHash: 'different-hash',
      firstName: 'Kwame',
      status: ApplicationStatus.PAYMENT_PENDING,
      decisionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      instrument: { id: 'inst-1', name: 'Acoustic Guitar', slug: 'acoustic-guitar' },
      student: null,
      invoices: [],
    });

    await expect(service.getStatus('app-1', 'wrong-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
