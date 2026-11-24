import Link from 'next/link';
import { Guitar, Music2, Piano, Drum, ArrowRight, CheckCircle2 } from 'lucide-react';

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
      <header className="border-b border-[var(--border)] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">
            Prime Maestros Hub
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a href="#programs" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              Programs
            </a>
            <a href="#how-it-works" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              Admissions
            </a>
            <Link
              href="/login"
              className="rounded-lg bg-[var(--foreground)] text-white px-4 py-2 hover:opacity-90 transition"
            >
              Portal Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">
            In-Person Music Academy &bull; Digital Learning Portal
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl leading-[1.1]">
            Discover Your Talent. Master Your Instrument.
          </h1>
          <p className="mt-6 text-lg text-[var(--muted-foreground)] max-w-2xl">
            Prime Maestros Hub combines structured physical, instructor-led lessons with a unified
            student portal for schedules, practice materials, assignments, and progress tracking.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-3 font-medium hover:opacity-95 transition"
            >
              Start Application (GH₵50 Registration)
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg border border-[var(--border)] bg-white px-6 py-3 font-medium hover:bg-[var(--muted)] transition"
            >
              Student &amp; Staff Portal
            </Link>
          </div>
        </section>

        <section id="programs" className="border-t border-[var(--border)] bg-white py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Initial Academy Instruments
            </h2>
            <p className="mt-2 text-[var(--muted-foreground)]">
              Choose one primary instrument on application; additional instruments can be added later.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {INSTRUMENTS.map(({ name, description, icon: Icon }) => (
                <div
                  key={name}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 flex flex-col gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center text-[var(--accent)]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg">{name}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-[var(--border)] py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Enrollment &amp; Onboarding Flow
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {STEPS.map((step, idx) => (
                <div
                  key={step}
                  className="rounded-xl border border-[var(--border)] bg-white p-5 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Step {idx + 1}
                    </p>
                    <p className="mt-1 text-sm font-medium">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 text-sm text-[var(--muted-foreground)] flex flex-col sm:flex-row justify-between gap-4">
          <span>Prime Maestros Hub &mdash; Foundation Setup</span>
          <span>Currency: GHS (GH₵) &bull; Timezone: Africa/Accra</span>
        </div>
      </footer>
    </div>
  );
}
