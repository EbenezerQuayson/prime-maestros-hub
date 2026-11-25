import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ProgramDetailDto } from '@/lib/api';

export const dynamic = 'force-dynamic';

const FALLBACK_PROGRAM_MAP: Record<string, ProgramDetailDto> = {
  'acoustic-guitar-mastery': {
    id: 'fallback-acoustic-guitar',
    name: 'Acoustic Guitar Mastery Program',
    slug: 'acoustic-guitar-mastery',
    description: 'Structured in-person training program for Acoustic Guitar.',
    durationWeeks: 12,
    instrument: {
      id: 'acoustic',
      name: 'Acoustic Guitar',
      slug: 'acoustic-guitar',
      description:
        'Foundational and contemporary acoustic guitar training covering posture, chords, rhythm, fingerstyle, and performance.',
    },
    courses: [],
  },
  'bass-guitar-foundation': {
    id: 'fallback-bass-guitar',
    name: 'Bass Guitar Foundation & Groove Program',
    slug: 'bass-guitar-foundation',
    description: 'Structured in-person training program for Bass Guitar.',
    durationWeeks: 12,
    instrument: {
      id: 'bass',
      name: 'Bass Guitar',
      slug: 'bass-guitar',
      description:
        'Groove, timing, fretboard theory, ear training, and ensemble playing on 4-string and 5-string bass guitars.',
    },
    courses: [],
  },
  'keyboard-piano-performance': {
    id: 'fallback-keyboard-piano',
    name: 'Keyboard & Piano Performance Program',
    slug: 'keyboard-piano-performance',
    description: 'Structured in-person training program for Keyboard/Piano.',
    durationWeeks: 12,
    instrument: {
      id: 'keyboard',
      name: 'Keyboard/Piano',
      slug: 'keyboard-piano',
      description:
        'Hand independence, sight-reading, harmony, chord voicings, and contemporary/gospel/classical repertoire.',
    },
    courses: [],
  },
  'drums-percussion-rhythm': {
    id: 'fallback-drums',
    name: 'Drums & Percussion Rhythm Program',
    slug: 'drums-percussion-rhythm',
    description: 'Structured in-person training program for Drums.',
    durationWeeks: 12,
    instrument: {
      id: 'drums',
      name: 'Drums',
      slug: 'drums',
      description:
        'Stick control, rudiments, limb coordination, groove pocket, and live band dynamics on acoustic drum kits.',
    },
    courses: [],
  },
};

async function getProgram(slug: string): Promise<ProgramDetailDto | null> {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiBase}/programs/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (res.status === 404) {
      return FALLBACK_PROGRAM_MAP[slug] ?? null;
    }
    if (!res.ok) {
      return FALLBACK_PROGRAM_MAP[slug] ?? null;
    }
    return (await res.json()) as ProgramDetailDto;
  } catch {
    return FALLBACK_PROGRAM_MAP[slug] ?? null;
  }
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = await getProgram(slug);

  if (!program) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-14 space-y-10">
        <div>
          <Link
            href="/programs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="size-4" />
            Back to all programs
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Badge>{program.instrument.name}</Badge>
            {program.durationWeeks && (
              <Badge variant="outline" className="gap-1">
                <Clock className="size-3" />
                {program.durationWeeks} weeks
              </Badge>
            )}
            <Badge variant="secondary">In-Person Classes</Badge>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {program.name}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            {program.instrument.description || program.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/apply?instrument=${program.instrument.slug}`}>
                Apply for {program.instrument.name} (GH₵50 Registration)
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Course Outline</h2>
          {program.courses.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  Curriculum &amp; Materials
                </CardTitle>
                <CardDescription>
                  Detailed modules, lesson objectives, sheet music, and practice recordings are
                  unlocked in the student portal once your enrollment is approved and assigned to a
                  class.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              {program.courses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <Badge variant="outline">{course.level}</Badge>
                    </div>
                    {course.description && (
                      <CardDescription>{course.description}</CardDescription>
                    )}
                  </CardHeader>
                  {course.modules.length > 0 && (
                    <CardContent className="space-y-3">
                      {course.modules.map((mod) => (
                        <div key={mod.id} className="rounded-lg border p-4 bg-background">
                          <p className="font-medium text-sm">
                            Module {mod.sequence}: {mod.title}
                          </p>
                          {mod.lessons.length > 0 && (
                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                              {mod.lessons.map((lesson) => (
                                <li key={lesson.id}>
                                  {lesson.title}
                                  {lesson.durationMinutes
                                    ? ` (${lesson.durationMinutes} min)`
                                    : ''}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
