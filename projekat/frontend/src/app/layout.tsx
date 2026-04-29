import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import Link from 'next/link';
import { Inter } from 'next/font/google';

import { ROUTES } from '@/constants';
import { AUTH_NAV_ITEMS, MAIN_NAV_ITEMS, SUPPORT_NAV_ITEMS } from '@/constants/content';
import '../styles/global.css';

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
        <div className="app-shell">
          <header className="shell-topbar">
            <Link className="brand" href={ROUTES.HOME}>
              <span className="brand-mark">SI</span>
              <span className="brand-copy">
                <strong>Service Interventions</strong>
                <small>Next.js + Express + MySQL skeleton</small>
              </span>
            </Link>

            <nav className="shell-nav" aria-label="Primary navigation">
              <div className="nav-group">
                {MAIN_NAV_ITEMS.map((item) => (
                  <Link key={item.to} href={item.to} className="nav-link">
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="nav-group nav-group--support">
                {SUPPORT_NAV_ITEMS.map((item) => (
                  <Link key={item.to} href={item.to} className="nav-link">
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="nav-group nav-group--auth">
                {AUTH_NAV_ITEMS.map((item) => (
                  <Link key={item.to} href={item.to} className="nav-link">
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          </header>

          <main className="shell-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
