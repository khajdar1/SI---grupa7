import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import Link from 'next/link';

import '../styles/global.css';

export const metadata: Metadata = {
  title: 'Sistem za upravljanje servisnim intervencijama',
  description: 'Next.js frontend skeleton for a service intervention management system.',
};

type RootLayoutProps = {
  children: ReactNode;
};

const mainNavItems = [
  { label: 'Home', to: '/' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Fault Reports', to: '/fault-reports' },
  { label: 'Interventions', to: '/interventions' },
  { label: 'Assignments', to: '/assignments' },
  { label: 'Reports', to: '/reports' },
];

const supportNavItems = [
  { label: 'History', to: '/history' },
  { label: 'Tickets', to: '/tickets' },
  { label: 'Map', to: '/map' },
  { label: 'Profile', to: '/profile' },
  { label: 'Settings', to: '/settings' },
  { label: 'Admin', to: '/admin' },
];

const authNavItems = [
  { label: 'Login', to: '/login' },
  { label: 'Register', to: '/register' },
  { label: 'Reset Password', to: '/reset-password' },
  { label: 'Logout', to: '/logout' },
];

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="bs">
      <body>
        <div className="app-shell">
          <header className="shell-topbar">
            <Link className="brand" href="/">
              <span className="brand-mark">SI</span>
              <span className="brand-copy">
                <strong>Service Interventions</strong>
                <small>Next.js + Express + MySQL skeleton</small>
              </span>
            </Link>

            <nav className="shell-nav" aria-label="Primary navigation">
              <div className="nav-group">
                {mainNavItems.map((item) => (
                  <Link key={item.to} href={item.to} className="nav-link">
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="nav-group nav-group--support">
                {supportNavItems.map((item) => (
                  <Link key={item.to} href={item.to} className="nav-link">
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="nav-group nav-group--auth">
                {authNavItems.map((item) => (
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