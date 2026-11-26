'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, apiFetch } from '@/lib/api';

function ActivateFormContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  async function handleActivate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 10) {
      setError('Password must be at least 10 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<{ message: string }>('/auth/activate', {
        method: 'POST',
        body: JSON.stringify({ token: token.trim(), password }),
      });
      setSuccessMessage(res.message);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to activate account. Please check your token.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResendStatus(null);
    try {
      const res = await apiFetch<{ message: string }>('/auth/resend-activation', {
        method: 'POST',
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      setResendStatus(res.message);
    } catch {
      setResendStatus('Could not request activation link right now.');
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Activate Student Account</CardTitle>
          <CardDescription>
            Set a strong password (minimum 10 characters) to activate your Prime Maestros Hub
            account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {successMessage ? (
            <div className="space-y-4">
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                <CheckCircle2 className="text-emerald-700" />
                <AlertTitle>Account Activated</AlertTitle>
                <AlertDescription className="text-emerald-800">
                  {successMessage}
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <Link href="/login">Proceed to Portal Sign In</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleActivate} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Activation Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="token">Activation Token</Label>
                <Input
                  id="token"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste token from activation email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 10 characters"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Activating...' : 'Activate Account'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {!successMessage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Need a fresh activation link?</CardTitle>
            <CardDescription>
              Enter the email you used during application and payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResend} className="space-y-3">
              {resendStatus && (
                <Alert>
                  <AlertDescription>{resendStatus}</AlertDescription>
                </Alert>
              )}
              <Input
                type="email"
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Resend Activation Email
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ActivatePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 md:py-16">
        <Suspense
          fallback={
            <div className="max-w-md mx-auto text-sm text-muted-foreground">
              Loading activation form...
            </div>
          }
        >
          <ActivateFormContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
