import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Drum,
  Guitar,
  Music2,
  Piano,
} from 'lucide-react';
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

const INSTRUMENTS = [
  {
    name: 'Acoustic Guitar',
    slug: 'acoustic-guitar-mastery',
    description:
      'Build solid technique from posture and rhythm strumming to fingerstyle and live performance.',
    icon: Guitar,
  },
  {
    name: 'Bass Guitar',
    slug: 'bass-guitar-foundation',
    description:
      'Master pocket, groove, fretboard fluency, and ensemble locking for modern bands.',
    icon: Music2,
  },
  {
    name: 'Keyboard / Piano',
    slug: 'keyboard-piano-performance',
    description:
      'Develop hand independence, chord voicings, sight-reading, and contemporary repertoire.',
    icon: Piano,
  },
  {
    name: 'Drums',
    slug: 'drums-percussion-rhythm',
    description:
      'Strengthen stick control, limb coordination, rudiments, and dynamic live rhythm.',
    icon: Drum,
  },
];

const STEPS = [
  'Submit your online application and select your primary instrument.',
  'Complete the GH₵50 one-time registration fee via verified checkout.',
  'Receive your unique PMH student number and account activation link.',
  'Get assigned to an instructor and in-person class to unlock course materials.',
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <Badge variant="secondary" className="mb-4 uppercase tracking-wider">
            In-Person Music Academy &bull; Digital Learning Portal
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl leading-[1.1]">
            Discover Your Talent. Master Your Instrument.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            Prime Maestros Hub combines structured physical, instructor-led lessons with a unified
            student portal for schedules, practice materials, assignments, and progress tracking.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/apply">
                Start Application (GH₵50 Registration)
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/programs">Explore Programs</Link>
            </Button>
          </div>
        </section>

        <section id="programs" className="border-t bg-card py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Initial Academy Instruments
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Choose one primary instrument on application; additional instruments can be added
                  later.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/programs">View All Programs</Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {INSTRUMENTS.map(({ name, slug, description, icon: Icon }) => (
                <Card key={name} className="bg-background flex flex-col justify-between">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-primary mb-2">
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg">{name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="leading-relaxed">
                      {description}
                    </CardDescription>
                    <Link
                      href={`/programs/${slug}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Program details
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Enrollment &amp; Onboarding Flow
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {STEPS.map((step, idx) => (
                <Card key={step} className="py-4">
                  <CardContent className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Step {idx + 1}
                      </p>
                      <p className="mt-1 text-sm font-medium">{step}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
