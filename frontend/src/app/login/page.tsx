'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
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
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <div className="mb-6">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]"
          >
            Prime Maestros Hub
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Portal Sign In</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Sign in with your academy student, instructor, or administrator account.
          </p>
        </div>

        {signedInUser ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold">Signed in successfully</p>
            <p className="mt-1">
              {signedInUser.email} ({signedInUser.role})
            </p>
            <p className="mt-2 text-xs text-emerald-700">
              Role-specific dashboards will be added in upcoming milestones.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--accent)] text-white py-2.5 text-sm font-medium hover:opacity-95 disabled:opacity-50 transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
