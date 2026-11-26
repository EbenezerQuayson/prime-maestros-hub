import { BadRequestException, ConflictException } from '@nestjs/common';
import { ApplicationStatus, EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminApplicationsService } from './admin-applications.service';

describe('AdminApplicationsService', () => {
  let service: AdminApplicationsService;
  let prisma: {
    application: { findUnique: jest.Mock };
    program: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let notificationsService: { sendEmail: jest.Mock };

  beforeEach(() => {
    prisma = {
      application: { findUnique: jest.fn() },
      program: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };
    notificationsService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    service = new AdminApplicationsService(
      prisma as unknown as PrismaService,
      notificationsService as never,
    );
  });

  it('rejects approval when application is still PAYMENT_PENDING', async () => {
    prisma.application.findUnique.mockResolvedValue({
      id: 'app-1',
      status: ApplicationStatus.PAYMENT_PENDING,
      studentId: null,
      student: null,
      enrollment: null,
    });

    await expect(
      service.approveApplication(
        'app-1',
        { programId: 'prog-1' },
        'admin-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('approves AWAITING_REVIEW application, creates ACTIVE enrollment, and notifies student', async () => {
    prisma.application.findUnique.mockResolvedValue({
      id: 'app-1',
      firstName: 'Kwame',
      status: ApplicationStatus.AWAITING_REVIEW,
      studentId: 'stu-1',
      student: {
        id: 'stu-1',
        studentNumber: 'PMH-2026-0001',
        user: { id: 'user-1', email: 'kwame@example.com' },
      },
      enrollment: null,
    });
    prisma.program.findUnique.mockResolvedValue({
      id: 'prog-1',
      name: 'Acoustic Guitar Mastery Program',
      active: true,
      courses: [{ id: 'course-1', title: 'Acoustic Guitar — Level 1: Foundations' }],
    });

    const txMock = {
      application: {
        update: jest.fn().mockResolvedValue({
          id: 'app-1',
          status: ApplicationStatus.APPROVED,
        }),
      },
      enrollment: {
        create: jest.fn().mockResolvedValue({
          id: 'enr-1',
          status: EnrollmentStatus.ACTIVE,
        }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    prisma.$transaction.mockImplementation(
      async (cb: (tx: typeof txMock) => unknown) => cb(txMock),
    );

    const res = await service.approveApplication(
      'app-1',
      { programId: 'prog-1' },
      'admin-1',
    );

    expect(res.application.status).toBe(ApplicationStatus.APPROVED);
    expect(res.enrollment.status).toBe(EnrollmentStatus.ACTIVE);
    expect(notificationsService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kwame@example.com',
        type: 'ENROLLMENT_APPROVED',
      }),
    );
  });

  it('prevents assigning a student to a class that has reached capacity', async () => {
    prisma.application.findUnique.mockResolvedValue({
      id: 'app-1',
      firstName: 'Kwame',
      status: ApplicationStatus.AWAITING_REVIEW,
      studentId: 'stu-1',
      student: {
        id: 'stu-1',
        studentNumber: 'PMH-2026-0001',
        user: { id: 'user-1', email: 'kwame@example.com' },
      },
      enrollment: null,
    });
    prisma.program.findUnique.mockResolvedValue({
      id: 'prog-1',
      name: 'Acoustic Guitar Mastery Program',
      active: true,
      courses: [{ id: 'course-1', title: 'Level 1' }],
    });

    const txMock = {
      class: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'cls-1',
          active: true,
          capacity: 5,
          instructorId: 'inst-1',
        }),
      },
      enrollment: {
        count: jest.fn().mockResolvedValue(5),
      },
    };
    prisma.$transaction.mockImplementation(
      async (cb: (tx: typeof txMock) => unknown) => cb(txMock),
    );

    await expect(
      service.approveApplication(
        'app-1',
        { programId: 'prog-1', classId: 'cls-1' },
        'admin-1',
      ),
    ).rejects.toThrow(ConflictException);
  });
});
