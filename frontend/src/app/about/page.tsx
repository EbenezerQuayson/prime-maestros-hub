import Link from 'next/link';
import { Award, BookOpen, MapPin, Users } from 'lucide-react';
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

const PILLARS = [
  {
    title: 'In-Person Coaching',
    description:
      'Hands-on physical classes led by vetted instructors with structured attendance and capacity limits so every student gets direct feedback.',
    icon: MapPin,
  },
  {
    title: 'Structured Curriculum',
    description:
      'Every instrument follows progressive modules, lesson objectives, sheet music/audio resources, assignments, and theory/practical assessments.',
    icon: BookOpen,
  },
  {
    title: 'Unified Student Portal',
    description:
      'Manage your timetable, course materials, assignment submissions, progress milestones, and tuition billing in one place.',
    icon: Users,
  },
  {
    title: 'Verified Onboarding',
    description:
      'Transparent GH₵50 registration, verified payment receipts, unique PMH student numbers, and clear enrollment approval.',
    icon: Award,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-16 md:py-20">
          <Badge variant="secondary" className="mb-4">
            About Prime Maestros Hub
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl">
            Raising disciplined, expressive musicians through guided practice.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Prime Maestros Hub (PMH) is an in-person music academy built around practical mentorship,
            measurable skill progression, and modern digital tools that keep students, instructors,
            and academy operations aligned.
          </p>
        </section>

        <section className="border-t bg-card py-16">
          <div className="max-w-6xl mx-auto px-6 grid gap-6 md:grid-cols-2">
            {PILLARS.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="bg-background">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-primary mb-2">
                    <Icon className="w-5 h-5" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t py-16">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Ready to start your musical journey?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Explore our four foundational instruments or submit your application today.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/programs">Browse Programs</Link>
              </Button>
              <Button asChild>
                <Link href="/apply">Apply Now (GH₵50)</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
