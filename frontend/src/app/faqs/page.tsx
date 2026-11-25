import Link from 'next/link';
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

const FAQS = [
  {
    q: 'Are lessons online or in person?',
    a: 'All lessons in our initial release are physical and in person. The digital portal supports your learning with schedules, attendance records, practice materials, assignments, and assessments.',
  },
  {
    q: 'What instruments can I apply for?',
    a: 'Prime Maestros Hub offers Acoustic Guitar, Bass Guitar, Keyboard/Piano, and Drums. Each applicant selects one primary instrument on application; additional instruments can be added later.',
  },
  {
    q: 'What is the GH₵50 registration fee for?',
    a: 'The GH₵50 one-time registration fee covers application processing and account setup. It is separate from monthly tuition.',
  },
  {
    q: 'When do I get my student number and course access?',
    a: 'Once your GH₵50 registration payment is verified server-side, your student account and unique PMH student number are created and an activation link is issued. Course materials unlock after an administrator approves your enrollment and assigns your physical class and instructor.',
  },
  {
    q: 'Can I upload a screenshot as proof of payment?',
    a: 'No. All payments are verified directly through our payment provider or authorized reconciliation—never via uploaded screenshots.',
  },
  {
    q: 'How much is monthly tuition?',
    a: 'Monthly tuition plans are configured by academy administrators per program and level. Your fee plan and monthly invoices will appear in your student portal once enrolled.',
  },
];

export default function FaqsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-16">
        <Badge variant="secondary" className="mb-4">
          Frequently Asked Questions
        </Badge>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          Admissions &amp; Academy FAQs
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Answers to common questions about applications, payments, classes, and the student portal.
        </p>

        <div className="mt-10 space-y-4">
          {FAQS.map((item) => (
            <Card key={item.q}>
              <CardHeader>
                <CardTitle className="text-lg">{item.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed text-foreground/80">
                  {item.a}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/apply">Apply Now (GH₵50)</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Still have questions? Contact Us</Link>
          </Button>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
