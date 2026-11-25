'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Clock } from 'lucide-react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary mb-1">
          <Clock className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Payment Return
          </span>
        </div>
        <CardTitle className="text-2xl">Verifying Payment Status</CardTitle>
        <CardDescription>
          Thank you for completing checkout. Prime Maestros Hub confirms all payments directly with
          the payment provider before activating accounts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reference && (
          <div className="rounded-lg border bg-background px-4 py-3 text-sm flex justify-between gap-4">
            <span className="text-muted-foreground">Provider Reference</span>
            <span className="font-mono font-medium">{reference}</span>
          </div>
        )}

        <Alert>
          <AlertTitle>Server-side verification required</AlertTitle>
          <AlertDescription>
            Returning to this page does not mark an invoice paid on its own. Once the backend
            verifies the webhook or transaction, your student number and activation link are issued.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/application-status">Check Application Status</Link>
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
