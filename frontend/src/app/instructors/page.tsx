import Link from 'next/link';
import { GraduationCap, Music2 } from 'lucide-react';
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
import type { PublicInstructorDto } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function getInstructors(): Promise<PublicInstructorDto[]> {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiBase}/instructors`, { cache: 'no-store' });
    if (!res.ok) return [];
    return (await res.json()) as PublicInstructorDto[];
  } catch {
    return [];
  }
}

export default async function InstructorsPage() {
  const instructors = await getInstructors();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-16">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-4">
            Faculty
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Meet Our Instructors
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Experienced practitioners dedicated to strong fundamentals, live ensemble musicianship,
            and personalized student feedback.
          </p>
        </div>

        {instructors.length === 0 ? (
          <Card className="mt-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music2 className="size-5 text-primary" />
                Instructor Roster Coming Soon
              </CardTitle>
              <CardDescription>
                Active instructor profiles created by Academy Administrators will appear here
                automatically. You can still apply now and select your preferred instrument—an
                instructor and physical class will be assigned upon enrollment approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/apply">Start Your Application</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {instructors.map((inst) => (
              <Card key={inst.id}>
                <CardHeader>
                  <CardTitle className="text-xl">
                    {inst.firstName} {inst.lastName}
                  </CardTitle>
                  {inst.qualifications && (
                    <CardDescription className="flex items-center gap-1.5 pt-1">
                      <GraduationCap className="size-4 shrink-0" />
                      <span>{inst.qualifications}</span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {inst.bio && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {inst.bio}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {inst.instruments.map(({ instrument }) => (
                      <Badge key={instrument.id} variant="secondary">
                        {instrument.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
