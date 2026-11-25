'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
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

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedInUser, setSignedInUser] = useState<LoginResponse['user'] | null>(
    null,
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSignedInUser(result.user);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Unable to reach authentication server',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-widest text-primary w-fit hover:underline"
          >
            Prime Maestros Hub
          </Link>
          <CardTitle className="text-2xl mt-2">Portal Sign In</CardTitle>
          <CardDescription>
            Sign in with your academy student, instructor, or administrator account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {signedInUser ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
              <CheckCircle2 className="text-emerald-700" />
              <AlertTitle>Signed in successfully</AlertTitle>
              <AlertDescription className="text-emerald-800">
                <p>
                  {signedInUser.email} ({signedInUser.role})
                </p>
                <p className="text-xs text-emerald-700">
                  Role-specific dashboards will be added in upcoming milestones.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Sign-in failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
