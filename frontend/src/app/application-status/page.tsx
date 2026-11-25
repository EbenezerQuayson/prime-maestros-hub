'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, apiFetch, formatGhsFromPesewas } from '@/lib/api';

interface ApplicationStatusResponse {
  applicationId: string;
  firstName: string;
  status: string;
  decisionReason: string | null;
  instrument: {
    id: string;
    name: string;
    slug: string;
  };
  studentNumber: string | null;
  registrationInvoice: {
    id: string;
    invoiceNumber: string;
    amountPesewas: number;
    currency: string;
    status: string;
    dueDate: string;
    paidAt: string | null;
  } | null;
  submittedAt: string;
  updatedAt: string;
}

function ApplicationStatusContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';
  const initialToken = searchParams.get('token') || '';

  const [applicationId, setApplicationId] = useState(initialId);
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplicationStatusResponse | null>(null);

  const lookup = useCallback(async (id: string, statusToken: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<ApplicationStatusResponse>(
        `/applications/${encodeURIComponent(id.trim())}/status`,
        {
          headers: {
            'x-application-token': statusToken.trim(),
          },
        },
      );
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to check application status.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialId && initialToken) {
      void lookup(initialId, initialToken);
    }
  }, [initialId, initialToken, lookup]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await lookup(applicationId, token);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Check Application Status</CardTitle>
          <CardDescription>
            Enter your Application ID and private Application Status Token to check registration
            payment and enrollment review progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Lookup Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="applicationId">Application ID</Label>
              <Input
                id="applicationId"
                required
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                placeholder="UUID from your application confirmation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Application Status Token</Label>
              <Input
                id="token"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your application status token"
              />
            </div>

            <Button type="submit" disabled={loading}>
              <Search className="size-4" />
              {loading ? 'Checking...' : 'Check Status'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xl">
                Hello, {result.firstName}
              </CardTitle>
              <Badge>{result.status}</Badge>
            </div>
            <CardDescription>
              Primary Instrument: <strong>{result.instrument.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {result.studentNumber && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Student Number</span>
                <span className="font-mono font-semibold">{result.studentNumber}</span>
              </div>
            )}
            {result.registrationInvoice && (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Registration Invoice</span>
                  <span className="font-mono">
                    {result.registrationInvoice.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    {formatGhsFromPesewas(result.registrationInvoice.amountPesewas)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge variant="outline">{result.registrationInvoice.status}</Badge>
                </div>
              </>
            )}
            {result.decisionReason && (
              <Alert variant="destructive">
                <AlertTitle>Review Note</AlertTitle>
                <AlertDescription>{result.decisionReason}</AlertDescription>
              </Alert>
            )}
            <div className="pt-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Go to Portal Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ApplicationStatusPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 md:py-16">
        <Suspense
          fallback={
            <div className="max-w-2xl mx-auto text-sm text-muted-foreground">
              Loading status lookup...
            </div>
          }
        >
          <ApplicationStatusContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
