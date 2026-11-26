import { CourseLevel, PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const INITIAL_INSTRUMENTS = [
  {
    name: 'Acoustic Guitar',
    slug: 'acoustic-guitar',
    description:
      'Foundational and contemporary acoustic guitar training covering posture, chords, rhythm, fingerstyle, and performance.',
    programName: 'Acoustic Guitar Mastery Program',
    programSlug: 'acoustic-guitar-mastery',
  },
  {
    name: 'Bass Guitar',
    slug: 'bass-guitar',
    description:
      'Groove, timing, fretboard theory, ear training, and ensemble playing on 4-string and 5-string bass guitars.',
    programName: 'Bass Guitar Foundation & Groove Program',
    programSlug: 'bass-guitar-foundation',
  },
  {
    name: 'Keyboard/Piano',
    slug: 'keyboard-piano',
    description:
      'Hand independence, sight-reading, harmony, chord voicings, and contemporary/gospel/classical repertoire.',
    programName: 'Keyboard & Piano Performance Program',
    programSlug: 'keyboard-piano-performance',
  },
  {
    name: 'Drums',
    slug: 'drums',
    description:
      'Stick control, rudiments, limb coordination, groove pocket, and live band dynamics on acoustic drum kits.',
    programName: 'Drums & Percussion Rhythm Program',
    programSlug: 'drums-percussion-rhythm',
  },
] as const;

async function main() {
  console.log('Seeding Prime Maestros Hub baseline data...');

  // 1. Seed the 4 initial instruments and their baseline programs
  for (const item of INITIAL_INSTRUMENTS) {
    const instrument = await prisma.instrument.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        active: true,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        active: true,
      },
    });

    const program = await prisma.program.upsert({
      where: { slug: item.programSlug },
      update: {
        name: item.programName,
        instrumentId: instrument.id,
        active: true,
      },
      create: {
        name: item.programName,
        slug: item.programSlug,
        description: `Structured in-person training program for ${item.name}.`,
        instrumentId: instrument.id,
        durationWeeks: 12,
        active: true,
      },
    });

    await prisma.course.upsert({
      where: {
        programId_sequence: {
          programId: program.id,
          sequence: 1,
        },
      },
      update: {
        title: `${item.name} — Level 1: Foundations`,
        level: CourseLevel.BEGINNER,
        active: true,
      },
      create: {
        programId: program.id,
        sequence: 1,
        level: CourseLevel.BEGINNER,
        title: `${item.name} — Level 1: Foundations`,
        description: `Core posture, technique, rhythm, and foundational repertoire for ${item.name}.`,
        active: true,
      },
    });
  }

  // 2. Seed baseline academy settings
  const defaultSettings = [
    {
      key: 'registration_fee_pesewas',
      value: 5000,
      description: 'One-time registration fee in minor currency units (GH₵50 = 5000 pesewas).',
    },
    {
      key: 'currency',
      value: 'GHS',
      description: 'Default currency code for all invoices and payments.',
    },
    {
      key: 'display_timezone',
      value: 'Africa/Accra',
      description: 'Default display timezone for schedules and timestamps.',
    },
    {
      key: 'student_id_prefix',
      value: 'PMH',
      description: 'Prefix for generated unique student numbers (e.g. PMH-2026-0001).',
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.academySetting.upsert({
      where: { key: setting.key },
      update: {
        description: setting.description,
      },
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
      },
    });
  }

  // 3. Seed current year student number counter
  const currentYear = new Date().getUTCFullYear();
  await prisma.studentNumberCounter.upsert({
    where: { year: currentYear },
    update: {},
    create: {
      year: currentYear,
      lastSequence: 0,
    },
  });

  // 4. Seed baseline Super Administrator account (development convenience)
  const adminEmail = (
    process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@primemaestros.local'
  )
    .trim()
    .toLowerCase();
  const adminPassword =
    process.env.SEED_SUPER_ADMIN_PASSWORD || 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Seed complete. Instruments: ${INITIAL_INSTRUMENTS.length}, Super Admin: ${adminEmail}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
