import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { Inter } from 'next/font/google';

import { AppNavigation, AuthRedirectNotice } from '@/components/shared';
import '@/styles/global.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sistem za upravljanje servisnim intervencijama',
  description: 'Next.js frontend skeleton for a service intervention management system.',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="bs" className={inter.variable}>
      <body>
        <div className="min-h-screen bg-background">
          <AppNavigation />
          <Suspense fallback={null}>
            <AuthRedirectNotice />
          </Suspense>
          <main className="mx-auto w-full max-w-[var(--content-max-width)] pb-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
