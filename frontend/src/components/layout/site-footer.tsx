import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export function SiteFooter() {
  return (
    <footer className="border-t bg-card py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="font-bold tracking-tight">Prime Maestros Hub</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discover Your Talent. Master Your Instrument. In-person music academy training with
              structured digital learning support.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold">Academy</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About PMH
                </Link>
              </li>
              <li>
                <Link href="/programs" className="hover:text-foreground transition-colors">
                  Programs &amp; Instruments
                </Link>
              </li>
              <li>
                <Link href="/instructors" className="hover:text-foreground transition-colors">
                  Instructors
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:text-foreground transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold">Admissions &amp; Portal</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>
                <Link href="/apply" className="hover:text-foreground transition-colors">
                  Apply Online (GH₵50)
                </Link>
              </li>
              <li>
                <Link
                  href="/application-status"
                  className="hover:text-foreground transition-colors"
                >
                  Check Application Status
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Student &amp; Staff Sign In
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold">Baseline Standards</p>
            <p className="text-muted-foreground">In-person instruction</p>
            <p className="text-muted-foreground">Currency: GHS (GH₵)</p>
            <p className="text-muted-foreground">Timezone: Africa/Accra</p>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Prime Maestros Hub. All rights reserved.</span>
          <span>Acoustic Guitar &bull; Bass Guitar &bull; Keyboard/Piano &bull; Drums</span>
        </div>
      </div>
    </footer>
  );
}
