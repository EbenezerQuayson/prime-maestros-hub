import { Injectable } from '@nestjs/common';
import { EmploymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InstructorsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllPublic() {
    return this.prisma.instructor.findMany({
      where: {
        active: true,
        employmentStatus: EmploymentStatus.ACTIVE,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        bio: true,
        qualifications: true,
        instruments: {
          select: {
            instrument: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }
}
