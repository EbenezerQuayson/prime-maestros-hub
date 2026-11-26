import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  ApplicationStatus,
  EnrollmentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApproveApplicationDto } from './dto/approve-application.dto';

@Injectable()
export class AdminApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  async listApplications(params: {
    status?: ApplicationStatus;
    instrumentId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {};
    if (params.status) {
      where.status = params.status;
    }
    if (params.instrumentId) {
      where.instrumentId = params.instrumentId;
    }
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        {
          student: {
            studentNumber: { contains: q, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          experienceLevel: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
          instrument: {
            select: { id: true, name: true, slug: true },
          },
          student: {
            select: {
              id: true,
              studentNumber: true,
              user: { select: { status: true } },
            },
          },
          invoices: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              invoiceNumber: true,
              amountPesewas: true,
              currency: true,
              status: true,
              paidAt: true,
            },
          },
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getApplicationDetail(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        address: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        experienceLevel: true,
        goals: true,
        availability: true,
        consentAcceptedAt: true,
        status: true,
        decisionReason: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
        instrument: {
          select: {
            id: true,
            name: true,
            slug: true,
            programs: {
              where: { active: true },
              select: {
                id: true,
                name: true,
                slug: true,
                courses: {
                  where: { active: true },
                  orderBy: { sequence: 'asc' },
                  select: { id: true, title: true, level: true, sequence: true },
                },
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            studentNumber: true,
            user: {
              select: {
                id: true,
                email: true,
                status: true,
                emailVerifiedAt: true,
              },
            },
          },
        },
        reviewer: {
          select: { id: true, email: true, role: true },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            type: true,
            amountPesewas: true,
            currency: true,
            status: true,
            paidAt: true,
            payments: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                provider: true,
                providerReference: true,
                status: true,
                channel: true,
                paidAt: true,
              },
            },
          },
        },
        enrollment: {
          select: {
            id: true,
            status: true,
            enrolledAt: true,
            program: { select: { id: true, name: true } },
            course: { select: { id: true, title: true, level: true } },
            instructor: {
              select: { id: true, firstName: true, lastName: true },
            },
            class: {
              select: { id: true, name: true, venue: true, room: true },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async approveApplication(
    applicationId: string,
    dto: ApproveApplicationDto,
    actorUserId: string,
    ipAddress?: string,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        student: {
          include: { user: { select: { id: true, email: true } } },
        },
        enrollment: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== ApplicationStatus.AWAITING_REVIEW) {
      throw new BadRequestException(
        `Cannot approve application in status ${application.status}. Payment must be verified first.`,
      );
    }

    if (!application.studentId || !application.student) {
      throw new BadRequestException(
        'Cannot approve application without a verified student profile',
      );
    }

    if (application.enrollment) {
      throw new ConflictException(
        'An enrollment already exists for this application',
      );
    }

    const program = await this.prisma.program.findUnique({
      where: { id: dto.programId },
      include: {
        courses: {
          where: { active: true },
          orderBy: { sequence: 'asc' },
          select: { id: true, title: true },
        },
      },
    });

    if (!program || !program.active) {
      throw new BadRequestException('Selected program is not active');
    }

    const selectedCourse = dto.courseId
      ? program.courses.find((c) => c.id === dto.courseId)
      : program.courses[0];

    if (!selectedCourse) {
      throw new BadRequestException(
        'Selected program does not have an active course available for assignment',
      );
    }

    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      let resolvedInstructorId = dto.instructorId ?? null;

      if (dto.classId) {
        const physicalClass = await tx.class.findUnique({
          where: { id: dto.classId },
          select: {
            id: true,
            active: true,
            capacity: true,
            instructorId: true,
          },
        });
        if (!physicalClass || !physicalClass.active) {
          throw new BadRequestException('Selected physical class is not active');
        }
        const activeCount = await tx.enrollment.count({
          where: {
            classId: physicalClass.id,
            status: EnrollmentStatus.ACTIVE,
          },
        });
        if (activeCount >= physicalClass.capacity) {
          throw new ConflictException(
            'Selected physical class has reached capacity',
          );
        }
        if (!resolvedInstructorId) {
          resolvedInstructorId = physicalClass.instructorId;
        }
      }

      if (resolvedInstructorId) {
        const instructor = await tx.instructor.findUnique({
          where: { id: resolvedInstructorId },
          select: { id: true, active: true },
        });
        if (!instructor || !instructor.active) {
          throw new BadRequestException('Selected instructor is not active');
        }
      }

      const updatedApp = await tx.application.update({
        where: { id: application.id },
        data: {
          status: ApplicationStatus.APPROVED,
          reviewerId: actorUserId,
          reviewedAt: now,
          decisionReason: dto.decisionReason?.trim() || null,
        },
      });

      const enrollment = await tx.enrollment.create({
        data: {
          studentId: application.studentId!,
          applicationId: application.id,
          programId: program.id,
          courseId: selectedCourse.id,
          instructorId: resolvedInstructorId,
          classId: dto.classId ?? null,
          status: EnrollmentStatus.ACTIVE,
          enrolledAt: now,
          startedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: 'APPLICATION_APPROVED',
          entityType: 'Application',
          entityId: application.id,
          ipAddress: ipAddress ?? null,
          metadata: {
            enrollmentId: enrollment.id,
            programId: program.id,
            courseId: selectedCourse.id,
            classId: dto.classId ?? null,
            instructorId: resolvedInstructorId,
          },
        },
      });

      return { application: updatedApp, enrollment };
    });

    if (this.notificationsService && application.student.user) {
      await this.notificationsService.sendEmail({
        userId: application.student.user.id,
        to: application.student.user.email,
        type: 'ENROLLMENT_APPROVED',
        subject: 'Prime Maestros Hub — Enrollment Approved',
        content: `Congratulations ${application.firstName}! Your application (${application.student.studentNumber}) has been approved for ${program.name} (${selectedCourse.title}). Sign in to the student portal to view your enrollment and course materials.`,
      });
    }

    return result;
  }

  async rejectApplication(
    applicationId: string,
    reason: string,
    actorUserId: string,
    ipAddress?: string,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        student: {
          include: { user: { select: { id: true, email: true } } },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (
      application.status !== ApplicationStatus.AWAITING_REVIEW &&
      application.status !== ApplicationStatus.PAYMENT_PENDING
    ) {
      throw new BadRequestException(
        `Cannot reject application in status ${application.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: application.id },
        data: {
          status: ApplicationStatus.REJECTED,
          reviewerId: actorUserId,
          reviewedAt: new Date(),
          decisionReason: reason.trim(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: 'APPLICATION_REJECTED',
          entityType: 'Application',
          entityId: application.id,
          ipAddress: ipAddress ?? null,
          metadata: { reason: reason.trim() },
        },
      });

      return app;
    });

    if (this.notificationsService && application.student?.user) {
      await this.notificationsService.sendEmail({
        userId: application.student.user.id,
        to: application.student.user.email,
        type: 'APPLICATION_REJECTED',
        subject: 'Prime Maestros Hub — Application Update',
        content: `Hello ${application.firstName}, thank you for applying to Prime Maestros Hub. Unfortunately your application was not approved at this time. Note: ${reason.trim()}`,
      });
    }

    return updated;
  }

  async requestInformation(
    applicationId: string,
    message: string,
    actorUserId: string,
    ipAddress?: string,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        student: {
          include: { user: { select: { id: true, email: true } } },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== ApplicationStatus.AWAITING_REVIEW) {
      throw new BadRequestException(
        'Can only request additional information for applications awaiting review',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: application.id },
        data: {
          reviewerId: actorUserId,
          decisionReason: `Info requested: ${message.trim()}`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: 'APPLICATION_INFO_REQUESTED',
          entityType: 'Application',
          entityId: application.id,
          ipAddress: ipAddress ?? null,
          metadata: { message: message.trim() },
        },
      });

      return app;
    });

    if (this.notificationsService && application.student?.user) {
      await this.notificationsService.sendEmail({
        userId: application.student.user.id,
        to: application.student.user.email,
        type: 'APPLICATION_INFO_REQUESTED',
        subject: 'Prime Maestros Hub — Additional Information Requested',
        content: `Hello ${application.firstName}, our admissions team requested additional information regarding your application: ${message.trim()}`,
      });
    }

    return updated;
  }
}
