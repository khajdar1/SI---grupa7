import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { Inter } from 'next/font/google';

import { AppNavigation, AuthRedirectNotice } from '@/components/shared';
import { I18nProvider } from '@/lib/i18n';
import '@/styles/global.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Service Intervention Management System',
  description: 'Next.js frontend skeleton for a service intervention management system.',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <I18nProvider>
          <div className="min-h-screen bg-background">
            <AppNavigation />
            <Suspense fallback={null}>
              <AuthRedirectNotice />
            </Suspense>
            <main className="mx-auto w-full max-w-[var(--content-max-width)] pb-10">{children}</main>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
