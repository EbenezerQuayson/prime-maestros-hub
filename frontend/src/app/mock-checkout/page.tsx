'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AlertCircle, CheckCircle2, CreditCard, ShieldCheck, XCircle } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError, apiFetch, formatGhsFromPesewas } from '@/lib/api';

function MockCheckoutContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || '';
  const invoiceNumber = searchParams.get('invoiceNumber') || 'PMH-REG';
  const amountPesewas = Number(searchParams.get('amountPesewas') || '5000');
  const callbackUrl = searchParams.get('callbackUrl') || '/payment-return';

  const [channel, setChannel] = useState('mobile_money');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function simulate(outcome: 'SUCCESS' | 'FAILED' | 'ABANDONED') {
    if (!reference) {
      setError('Missing payment reference.');
      return;
    }
    setError(null);
    setProcessing(true);

    try {
      await apiFetch('/payments/mock/simulate', {
        method: 'POST',
        body: JSON.stringify({
          reference,
          outcome,
          channel,
        }),
      });
      window.location.assign(callbackUrl);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to simulate payment webhook.',
      );
      setProcessing(false);
    }
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="size-3" />
            Local Mock Checkout
          </Badge>
          <span className="text-xs font-mono text-muted-foreground">
            {invoiceNumber}
          </span>
        </div>
        <CardTitle className="text-2xl mt-2">
          {formatGhsFromPesewas(amountPesewas)}
        </CardTitle>
        <CardDescription>
          Development payment simulator. Choosing an outcome triggers a signed webhook and
          server-side verification before returning to Prime Maestros Hub.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Simulation Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg border bg-background px-4 py-3 text-xs space-y-1">
          <p className="text-muted-foreground">Payment Reference</p>
          <p className="font-mono font-medium break-all">{reference || 'N/A'}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="channel">Payment Channel</Label>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger id="channel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mobile_money">
                Mobile Money (MTN / Telecel / AT)
              </SelectItem>
              <SelectItem value="card">Debit / Credit Card</SelectItem>
              <SelectItem value="bank">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2.5 pt-2">
          <Button
            type="button"
            className="w-full"
            disabled={processing || !reference}
            onClick={() => simulate('SUCCESS')}
          >
            <CheckCircle2 className="size-4" />
            {processing ? 'Processing...' : 'Authorize & Simulate Success'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={processing || !reference}
            onClick={() => simulate('FAILED')}
          >
            <XCircle className="size-4" />
            Simulate Failed Payment
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={processing}
            onClick={() => window.location.assign(callbackUrl)}
          >
            <CreditCard className="size-4" />
            Cancel &amp; Return
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MockCheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-14">
        <Suspense
          fallback={
            <div className="max-w-lg mx-auto text-sm text-muted-foreground">
              Loading checkout simulator...
            </div>
          }
        >
          <MockCheckoutContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
