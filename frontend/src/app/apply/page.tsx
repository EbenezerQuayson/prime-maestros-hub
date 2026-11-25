'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Copy } from 'lucide-react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ApiError,
  apiFetch,
  formatGhsFromPesewas,
  type InstrumentDto,
} from '@/lib/api';

interface CreateApplicationResponse {
  applicationId: string;
  status: string;
  applicationToken: string;
  instrument: {
    id: string;
    name: string;
    slug: string;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    amountPesewas: number;
    currency: string;
    status: string;
    dueDate: string;
  };
}

const EXPERIENCE_LEVELS = [
  'Complete Beginner',
  'Beginner (Under 1 year)',
  'Intermediate (1-3 years)',
  'Advanced (3+ years)',
];

function ApplyFormContent() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get('instrument') || '';

  const [instruments, setInstruments] = useState<InstrumentDto[]>([]);
  const [loadingInstruments, setLoadingInstruments] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [instrumentId, setInstrumentId] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Complete Beginner');
  const [availability, setAvailability] = useState('');
  const [goals, setGoals] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<CreateApplicationResponse | null>(
    null,
  );
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch<InstrumentDto[]>('/instruments')
      .then((data) => {
        if (!active) return;
        setInstruments(data);
        if (initialSlug) {
          const matched = data.find((item) => item.slug === initialSlug);
          if (matched) setInstrumentId(matched.id);
        }
      })
      .catch(() => {
        if (!active) return;
        setError(
          'Could not load available instruments from the API server. Please ensure the backend is running.',
        );
      })
      .finally(() => {
        if (active) setLoadingInstruments(false);
      });
    return () => {
      active = false;
    };
  }, [initialSlug]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!instrumentId) {
      setError('Please select a primary instrument.');
      return;
    }
    if (!consentAccepted) {
      setError('Please confirm consent and academy terms before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiFetch<CreateApplicationResponse>('/applications', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          instrumentId,
          dateOfBirth: dateOfBirth || undefined,
          address: address || undefined,
          emergencyContactName: emergencyContactName || undefined,
          emergencyContactPhone: emergencyContactPhone || undefined,
          experienceLevel: experienceLevel || undefined,
          availability: availability || undefined,
          goals: goals || undefined,
          consentAccepted,
        }),
      });
      setSubmitted(response);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to submit application. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyToken(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {
      setCopiedToken(false);
    }
  }

  if (submitted) {
    const statusHref = `/application-status?id=${encodeURIComponent(submitted.applicationId)}&token=${encodeURIComponent(submitted.applicationToken)}`;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <CheckCircle2 className="size-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Application Received
            </span>
          </div>
          <CardTitle className="text-2xl">
            Complete Your Registration Invoice
          </CardTitle>
          <CardDescription>
            Your application for <strong>{submitted.instrument.name}</strong> has been created
            and is awaiting the one-time GH₵50 registration payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-background p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Application ID</span>
              <span className="font-mono font-medium">{submitted.applicationId}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Application Status</span>
              <Badge variant="secondary">{submitted.status}</Badge>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Invoice Number</span>
              <span className="font-mono font-medium">
                {submitted.invoice.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Registration Fee</span>
              <span className="font-semibold">
                {formatGhsFromPesewas(submitted.invoice.amountPesewas)} (
                {submitted.invoice.status})
              </span>
            </div>
          </div>

          <Alert>
            <AlertTitle>Save your Application Status Token</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Keep this token private—you will need it to check your application and payment
                status safely.
              </p>
              <div className="flex items-center gap-2 w-full">
                <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono break-all">
                  {submitted.applicationToken}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToken(submitted.applicationToken)}
                >
                  <Copy className="size-3.5" />
                  {copiedToken ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertTitle>Next Step: Hosted Payment Checkout (Milestone M3)</AlertTitle>
            <AlertDescription>
              Online checkout initialization (Paystack / Hubtel with Mobile Money support) will be
              connected to this invoice in Milestone M3. Your student account and unique PMH
              number will be created automatically once payment is verified server-side.
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={statusHref}>
                View Application Status
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/programs">Browse Programs</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="secondary">One-Time Registration Fee: GH₵50.00</Badge>
          <span className="text-xs text-muted-foreground">
            Separate from monthly tuition
          </span>
        </div>
        <CardTitle className="text-2xl mt-2">
          Student Admissions Application
        </CardTitle>
        <CardDescription>
          Apply for in-person lessons at Prime Maestros Hub. Select one primary instrument to get
          started.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Application Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                required
                minLength={2}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Kwame"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                required
                minLength={2}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Mensah"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kwame@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone / Mobile Money Number *</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 24 000 0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Residential Area / Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="East Legon, Accra"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
              <Input
                id="emergencyContactName"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Abena Mensah"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
              <Input
                id="emergencyContactPhone"
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="+233 20 000 0000"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="instrument">Primary Instrument *</Label>
              <Select
                value={instrumentId}
                onValueChange={setInstrumentId}
                disabled={loadingInstruments || instruments.length === 0}
              >
                <SelectTrigger id="instrument">
                  <SelectValue
                    placeholder={
                      loadingInstruments
                        ? 'Loading instruments...'
                        : 'Select primary instrument'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {instruments.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Current Experience Level</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger id="experienceLevel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">Preferred Schedule / Availability</Label>
            <Input
              id="availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="e.g. Saturday mornings or Tuesday/Thursday evenings"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Learning Goals</Label>
            <Textarea
              id="goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="Tell us what you hope to achieve at Prime Maestros Hub..."
            />
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
            <Checkbox
              id="consentAccepted"
              checked={consentAccepted}
              onCheckedChange={(checked) => setConsentAccepted(checked === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="consentAccepted"
              className="text-xs leading-relaxed font-normal text-muted-foreground cursor-pointer"
            >
              I confirm that the information provided is accurate, understand that lessons are
              conducted in person, and consent to Prime Maestros Hub processing my application
              and generating a GH₵50.00 registration invoice.
            </Label>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={submitting || loadingInstruments}
            className="w-full sm:w-auto"
          >
            {submitting
              ? 'Submitting Application...'
              : 'Submit Application & Generate GH₵50 Invoice'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ApplyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 md:py-16">
        <Suspense
          fallback={
            <div className="max-w-3xl mx-auto text-sm text-muted-foreground">
              Loading application form...
            </div>
          }
        >
          <ApplyFormContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
