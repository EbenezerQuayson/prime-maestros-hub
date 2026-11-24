import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InstrumentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.instrument.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        programs: {
          where: { active: true },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            durationWeeks: true,
          },
        },
      },
    });
  }
}
