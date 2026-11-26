import { NotFoundException } from '@nestjs/common';
import { ApplicationStatus, EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StudentsService } from './students.service';

describe('StudentsService', () => {
  let service: StudentsService;
  let prisma: {
    student: { findUnique: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      student: { findUnique: jest.fn() },
    };
    service = new StudentsService(prisma as unknown as PrismaService);
  });

  it('withholds course access when student account is active but application is still AWAITING_REVIEW', async () => {
    prisma.student.findUnique.mockResolvedValue({
      id: 'stu-1',
      studentNumber: 'PMH-2026-0001',
      applications: [
        { id: 'app-1', status: ApplicationStatus.AWAITING_REVIEW },
      ],
      enrollments: [],
    });

    const result = await service.getMyCourses('user-1');

    expect(result.studentNumber).toBe('PMH-2026-0001');
    expect(result.accessGranted).toBe(false);
    expect(result.latestApplicationStatus).toBe(
      ApplicationStatus.AWAITING_REVIEW,
    );
    expect(result.courses).toEqual([]);
  });

  it('grants course access when student has an ACTIVE enrollment', async () => {
    prisma.student.findUnique.mockResolvedValue({
      id: 'stu-1',
      studentNumber: 'PMH-2026-0001',
      applications: [{ id: 'app-1', status: ApplicationStatus.APPROVED }],
      enrollments: [
        {
          id: 'enr-1',
          status: EnrollmentStatus.ACTIVE,
          enrolledAt: new Date(),
          program: {
            id: 'prog-1',
            name: 'Acoustic Guitar Mastery Program',
            slug: 'acoustic-guitar-mastery',
            instrument: {
              id: 'inst-1',
              name: 'Acoustic Guitar',
              slug: 'acoustic-guitar',
            },
          },
          course: {
            id: 'course-1',
            title: 'Acoustic Guitar — Level 1: Foundations',
            level: 'BEGINNER',
            description: 'Foundations',
            modules: [],
          },
          instructor: null,
          class: null,
        },
      ],
    });

    const result = await service.getMyCourses('user-1');

    expect(result.accessGranted).toBe(true);
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].course.title).toContain('Acoustic Guitar');
  });

  it('throws NotFoundException when user has no student profile', async () => {
    prisma.student.findUnique.mockResolvedValue(null);

    await expect(service.getMyProfile('missing-user')).rejects.toThrow(
      NotFoundException,
    );
  });
});
