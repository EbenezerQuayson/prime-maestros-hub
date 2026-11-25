'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, Music, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/programs', label: 'Programs' },
  { href: '/instructors', label: 'Instructors' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/contact', label: 'Contact' },
  { href: '/application-status', label: 'Check Status' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b bg-card/90 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg tracking-tight shrink-0"
        >
          <span className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Music className="size-4" />
          </span>
          <span>Prime Maestros Hub</span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-5 text-sm font-medium"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'transition-colors hover:text-foreground',
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/login">Portal Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/apply">Apply Now</Link>
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card px-6 py-4 space-y-3">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'py-1.5 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 pt-2 border-t">
            <Button asChild size="sm" onClick={() => setMobileOpen(false)}>
              <Link href="/apply">Apply Now (GH₵50)</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              onClick={() => setMobileOpen(false)}
            >
              <Link href="/login">Portal Sign In</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
