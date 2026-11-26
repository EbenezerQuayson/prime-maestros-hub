import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: {
        id: true,
        studentNumber: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        phone: true,
        email: true,
        address: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelationship: true,
        createdAt: true,
        applications: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            decisionReason: true,
            createdAt: true,
            instrument: { select: { id: true, name: true, slug: true } },
          },
        },
        enrollments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            enrolledAt: true,
            program: { select: { id: true, name: true, slug: true } },
            course: { select: { id: true, title: true, level: true } },
            instructor: {
              select: { id: true, firstName: true, lastName: true },
            },
            class: {
              select: { id: true, name: true, venue: true, room: true },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            invoiceNumber: true,
            type: true,
            amountPesewas: true,
            currency: true,
            status: true,
            dueDate: true,
            paidAt: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return student;
  }

  async updateMyProfile(userId: string, dto: UpdateMyProfileDto) {
    const existing = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Student profile not found');
    }

    return this.prisma.student.update({
      where: { userId },
      data: {
        phone: dto.phone?.trim(),
        address: dto.address !== undefined ? dto.address.trim() || null : undefined,
        emergencyContactName:
          dto.emergencyContactName !== undefined
            ? dto.emergencyContactName.trim() || null
            : undefined,
        emergencyContactPhone:
          dto.emergencyContactPhone !== undefined
            ? dto.emergencyContactPhone.trim() || null
            : undefined,
        emergencyContactRelationship:
          dto.emergencyContactRelationship !== undefined
            ? dto.emergencyContactRelationship.trim() || null
            : undefined,
      },
      select: {
        id: true,
        studentNumber: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        address: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelationship: true,
      },
    });
  }

  async getMyCourses(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: {
        id: true,
        studentNumber: true,
        applications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, status: true },
        },
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          orderBy: { enrolledAt: 'desc' },
          select: {
            id: true,
            status: true,
            enrolledAt: true,
            program: {
              select: {
                id: true,
                name: true,
                slug: true,
                instrument: { select: { id: true, name: true, slug: true } },
              },
            },
            course: {
              select: {
                id: true,
                title: true,
                level: true,
                description: true,
                modules: {
                  orderBy: { sequence: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    sequence: true,
                    lessons: {
                      where: { published: true },
                      orderBy: { sequence: 'asc' },
                      select: {
                        id: true,
                        title: true,
                        sequence: true,
                        durationMinutes: true,
                      },
                    },
                  },
                },
              },
            },
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

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return {
      studentNumber: student.studentNumber,
      accessGranted: student.enrollments.length > 0,
      latestApplicationStatus: student.applications[0]?.status ?? null,
      courses: student.enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        enrollmentStatus: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        program: enrollment.program,
        course: enrollment.course,
        instructor: enrollment.instructor,
        class: enrollment.class,
      })),
    };
  }

  async listStudents(params: { search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {};
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { studentNumber: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          studentNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
          user: { select: { status: true } },
          enrollments: {
            select: {
              id: true,
              status: true,
              program: { select: { id: true, name: true } },
              course: { select: { id: true, title: true } },
            },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getStudentDetail(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            emailVerifiedAt: true,
            lastLoginAt: true,
          },
        },
        applications: {
          orderBy: { createdAt: 'desc' },
          include: { instrument: { select: { id: true, name: true } } },
        },
        enrollments: {
          orderBy: { createdAt: 'desc' },
          include: {
            program: { select: { id: true, name: true } },
            course: { select: { id: true, title: true, level: true } },
            instructor: {
              select: { id: true, firstName: true, lastName: true },
            },
            class: { select: { id: true, name: true, venue: true } },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async updateEnrollment(
    enrollmentId: string,
    dto: UpdateEnrollmentDto,
    actorUserId: string,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!existing) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.classId) {
        const physicalClass = await tx.class.findUnique({
          where: { id: dto.classId },
          select: { id: true, active: true, capacity: true },
        });
        if (!physicalClass || !physicalClass.active) {
          throw new BadRequestException('Selected class is not active');
        }
        if (dto.classId !== existing.classId) {
          const activeCount = await tx.enrollment.count({
            where: {
              classId: dto.classId,
              status: EnrollmentStatus.ACTIVE,
            },
          });
          if (activeCount >= physicalClass.capacity) {
            throw new ConflictException('Selected class has reached capacity');
          }
        }
      }

      const updated = await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: dto.status,
          courseId: dto.courseId,
          instructorId: dto.instructorId,
          classId: dto.classId,
        },
        include: {
          program: { select: { id: true, name: true } },
          course: { select: { id: true, title: true, level: true } },
          instructor: {
            select: { id: true, firstName: true, lastName: true },
          },
          class: { select: { id: true, name: true, venue: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: 'ENROLLMENT_UPDATED',
          entityType: 'Enrollment',
          entityId: enrollmentId,
          ipAddress: ipAddress ?? null,
          metadata: {
            status: dto.status,
            courseId: dto.courseId,
            instructorId: dto.instructorId,
            classId: dto.classId,
          },
        },
      });

      return updated;
    });
  }
}
