import Link from 'next/link';
import { ArrowRight, Clock, Layers } from 'lucide-react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ProgramListDto } from '@/lib/api';

export const dynamic = 'force-dynamic';

const FALLBACK_PROGRAMS: ProgramListDto[] = [
  {
    id: 'fallback-acoustic-guitar',
    name: 'Acoustic Guitar Mastery Program',
    slug: 'acoustic-guitar-mastery',
    description: 'Structured in-person training program for Acoustic Guitar.',
    durationWeeks: 12,
    instrument: { id: 'acoustic', name: 'Acoustic Guitar', slug: 'acoustic-guitar' },
    courses: [],
  },
  {
    id: 'fallback-bass-guitar',
    name: 'Bass Guitar Foundation & Groove Program',
    slug: 'bass-guitar-foundation',
    description: 'Structured in-person training program for Bass Guitar.',
    durationWeeks: 12,
    instrument: { id: 'bass', name: 'Bass Guitar', slug: 'bass-guitar' },
    courses: [],
  },
  {
    id: 'fallback-keyboard-piano',
    name: 'Keyboard & Piano Performance Program',
    slug: 'keyboard-piano-performance',
    description: 'Structured in-person training program for Keyboard/Piano.',
    durationWeeks: 12,
    instrument: { id: 'keyboard', name: 'Keyboard/Piano', slug: 'keyboard-piano' },
    courses: [],
  },
  {
    id: 'fallback-drums',
    name: 'Drums & Percussion Rhythm Program',
    slug: 'drums-percussion-rhythm',
    description: 'Structured in-person training program for Drums.',
    durationWeeks: 12,
    instrument: { id: 'drums', name: 'Drums', slug: 'drums' },
    courses: [],
  },
];

async function getPrograms(): Promise<{ programs: ProgramListDto[]; live: boolean }> {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiBase}/programs`, { cache: 'no-store' });
    if (!res.ok) {
      return { programs: FALLBACK_PROGRAMS, live: false };
    }
    const data = (await res.json()) as ProgramListDto[];
    return { programs: data.length > 0 ? data : FALLBACK_PROGRAMS, live: true };
  } catch {
    return { programs: FALLBACK_PROGRAMS, live: false };
  }
}

export default async function ProgramsPage() {
  const { programs, live } = await getPrograms();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-16">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-4">
            Academy Programs
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Instruments &amp; Programs
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            In-person instruction across four core instruments, supported by structured courses,
            practice resources, and progress tracking.
          </p>
        </div>

        {!live && (
          <Alert className="mt-8">
            <AlertTitle>Showing baseline academy catalog</AlertTitle>
            <AlertDescription>
              Connect the backend API and PostgreSQL seed data to view live program updates and
              published course levels.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {programs.map((program) => (
            <Card key={program.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Badge variant="outline">{program.instrument.name}</Badge>
                  {program.durationWeeks && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      {program.durationWeeks} weeks
                    </span>
                  )}
                </div>
                <CardTitle className="text-xl">{program.name}</CardTitle>
                <CardDescription className="pt-1 leading-relaxed">
                  {program.description ||
                    `Hands-on in-person ${program.instrument.name} training.`}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Layers className="size-3.5" />
                  <span>
                    {program.courses.length > 0
                      ? `${program.courses.length} structured course level(s)`
                      : 'Beginner to advanced progression'}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex flex-wrap gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/programs/${program.slug}`}>
                    View Syllabus
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/apply?instrument=${program.instrument.slug}`}>
                    Apply for {program.instrument.name}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
