import Link from 'next/link';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
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

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-16">
        <Badge variant="secondary" className="mb-4">
          Contact
        </Badge>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          Get in Touch with PMH
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
          Have questions about class schedules, instrument placement, or enrollment status? Reach out
          to the academy admissions desk.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="size-4 text-primary" />
                Admissions Email
              </CardTitle>
              <CardDescription>For application and enrollment inquiries</CardDescription>
            </CardHeader>
            <CardContent className="text-sm font-medium">
              admissions@primemaestros.local
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="size-4 text-primary" />
                Academy Desk
              </CardTitle>
              <CardDescription>Call or WhatsApp during office hours</CardDescription>
            </CardHeader>
            <CardContent className="text-sm font-medium">
              +233 (0) 24 000 0000
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="size-4 text-primary" />
                Campus &amp; Lessons
              </CardTitle>
              <CardDescription>In-person academy sessions</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Accra, Ghana (Physical venue details are assigned with your class timetable upon
              enrollment approval.)
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="size-4 text-primary" />
                Office Hours
              </CardTitle>
              <CardDescription>Africa/Accra (GMT)</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Monday &ndash; Saturday, 9:00 AM &ndash; 6:00 PM
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/apply">Apply Online</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/application-status">Check Existing Application</Link>
          </Button>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
