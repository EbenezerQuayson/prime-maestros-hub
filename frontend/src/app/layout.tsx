import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prime Maestros Hub | Discover Your Talent. Master Your Instrument.',
  description:
    'In-person music academy training for Acoustic Guitar, Bass Guitar, Keyboard/Piano, and Drums with structured digital learning resources.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
