'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
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
import { ApiError, apiFetch } from '@/lib/api';

interface VerifyPaymentResponse {
  providerReference: string;
  status: string;
  invoiceStatus: string;
  studentNumber: string | null;
  idempotent: boolean;
}

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref') || '';
  const queryApplicationId = searchParams.get('applicationId') || '';

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<VerifyPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAuth, setSavedAuth] = useState<{
    applicationId: string;
    applicationToken: string;
  } | null>(null);

  useEffect(() => {
    let parsed: { applicationId: string; applicationToken: string } | null = null;
    try {
      const raw = sessionStorage.getItem('pmh_pending_application');
      if (raw) {
        parsed = JSON.parse(raw) as {
          applicationId: string;
          applicationToken: string;
        };
        setSavedAuth(parsed);
      }
    } catch {
      parsed = null;
    }

    if (reference && parsed?.applicationToken) {
      setVerifying(true);
      apiFetch<VerifyPaymentResponse>(
        `/payments/${encodeURIComponent(reference)}/verify`,
        {
          method: 'POST',
          headers: {
            'x-application-token': parsed.applicationToken,
          },
        },
      )
        .then((res) => setVerified(res))
        .catch((err) => {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not verify payment automatically.',
          );
        })
        .finally(() => setVerifying(false));
    }
  }, [reference]);

  const statusHref =
    savedAuth?.applicationId && savedAuth?.applicationToken
      ? `/application-status?id=${encodeURIComponent(savedAuth.applicationId)}&token=${encodeURIComponent(savedAuth.applicationToken)}`
      : queryApplicationId
        ? `/application-status?id=${encodeURIComponent(queryApplicationId)}`
        : '/application-status';

  const isSuccess = verified?.status === 'SUCCESS';

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary mb-1">
          {isSuccess ? (
            <CheckCircle2 className="size-5 text-emerald-700" />
          ) : (
            <Clock className="size-5" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider">
            Payment Return
          </span>
        </div>
        <CardTitle className="text-2xl">
          {verifying
            ? 'Verifying Payment with Provider...'
            : isSuccess
              ? 'Registration Payment Confirmed'
              : 'Payment Status Check'}
        </CardTitle>
        <CardDescription>
          Prime Maestros Hub confirms every transaction server-to-server with the payment provider
          before creating your student account and student number.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {reference && (
          <div className="rounded-lg border bg-background px-4 py-3 text-sm flex justify-between gap-4">
            <span className="text-muted-foreground">Provider Reference</span>
            <span className="font-mono font-medium">{reference}</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Verification Notice</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {verified && (
          <div className="rounded-lg border bg-background p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Payment Status</span>
              <Badge variant={isSuccess ? 'default' : 'secondary'}>
                {verified.status}
              </Badge>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Invoice Status</span>
              <Badge variant="outline">{verified.invoiceStatus}</Badge>
            </div>
            {verified.studentNumber && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Student Number</span>
                <span className="font-mono font-semibold text-emerald-700">
                  {verified.studentNumber}
                </span>
              </div>
            )}
          </div>
        )}

        {!verified && !verifying && (
          <Alert>
            <AlertTitle>Server-side verification required</AlertTitle>
            <AlertDescription>
              Returning to this page does not mark an invoice paid on its own. Use your
              Application ID and Token below to inspect your verified application status.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={statusHref}>Check Application Status</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PaymentReturnPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-16">
        <Suspense
          fallback={
            <div className="max-w-xl mx-auto text-sm text-muted-foreground">
              Loading payment status...
            </div>
          }
        >
          <PaymentReturnContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
