import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Drum,
  Guitar,
  Music2,
  Piano,
} from 'lucide-react';
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
    description:
      'Build solid technique from posture and rhythm strumming to fingerstyle and live performance.',
    icon: Guitar,
  },
  {
    name: 'Bass Guitar',
    description:
      'Master pocket, groove, fretboard fluency, and ensemble locking for modern bands.',
    icon: Music2,
  },
  {
    name: 'Keyboard / Piano',
    description:
      'Develop hand independence, chord voicings, sight-reading, and contemporary repertoire.',
    icon: Piano,
  },
  {
    name: 'Drums',
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
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">
            Prime Maestros Hub
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a
              href="#programs"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Programs
            </a>
            <a
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Admissions
            </a>
            <Button asChild size="sm" variant="secondary">
              <Link href="/login">Portal Sign In</Link>
            </Button>
          </nav>
        </div>
      </header>

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
              <a href="#how-it-works">
                Start Application (GH₵50 Registration)
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Student &amp; Staff Portal</Link>
            </Button>
          </div>
        </section>

        <section id="programs" className="border-t bg-card py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Initial Academy Instruments
            </h2>
            <p className="mt-2 text-muted-foreground">
              Choose one primary instrument on application; additional instruments can be added later.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {INSTRUMENTS.map(({ name, description, icon: Icon }) => (
                <Card key={name} className="bg-background">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-primary mb-2">
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg">{name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">
                      {description}
                    </CardDescription>
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

      <footer className="border-t bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 text-sm text-muted-foreground flex flex-col sm:flex-row justify-between gap-4">
          <span>Prime Maestros Hub &mdash; Foundation Setup</span>
          <span>Currency: GHS (GH₵) &bull; Timezone: Africa/Accra</span>
        </div>
      </footer>
    </div>
  );
}
