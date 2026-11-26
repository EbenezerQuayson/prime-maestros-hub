'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Music } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { logoutSession, type AuthUser } from '@/lib/auth';

export function PortalHeader({
  user,
  homeHref,
  title,
}: {
  user: AuthUser | null;
  homeHref: string;
  title: string;
}) {
  const router = useRouter();

  async function handleSignOut() {
    await logoutSession();
    router.push('/login');
  }

  return (
    <header className="border-b bg-card sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={homeHref}
            className="flex items-center gap-2 font-bold tracking-tight"
          >
            <span className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Music className="size-4" />
            </span>
            <span>Prime Maestros Hub</span>
          </Link>
          <Badge variant="outline" className="hidden sm:inline-flex">
            {title}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="hidden md:inline text-xs text-muted-foreground">
                {user.email}
              </span>
              <Badge variant="secondary">{user.role}</Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="size-3.5" />
                Sign Out
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
