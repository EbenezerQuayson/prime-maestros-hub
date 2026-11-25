import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.program.findMany({
      where: { active: true, instrument: { active: true } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        durationWeeks: true,
        instrument: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        courses: {
          where: { active: true },
          orderBy: { sequence: 'asc' },
          select: {
            id: true,
            level: true,
            title: true,
            sequence: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    const program = await this.prisma.program.findFirst({
      where: { slug, active: true, instrument: { active: true } },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        durationWeeks: true,
        instrument: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        courses: {
          where: { active: true },
          orderBy: { sequence: 'asc' },
          select: {
            id: true,
            level: true,
            title: true,
            description: true,
            sequence: true,
            modules: {
              orderBy: { sequence: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                sequence: true,
                lessons: {
                  where: { published: true },
                  orderBy: { sequence: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    durationMinutes: true,
                    sequence: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException(`Program "${slug}" not found`);
    }

    return program;
  }
}
