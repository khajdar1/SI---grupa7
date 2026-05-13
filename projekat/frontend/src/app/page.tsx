'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  ClipboardList,
  Shield,
  UserCheck,
  Wrench,
  ArrowRight,
  Zap,
  CheckCircle2,
} from 'lucide-react';

import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: <AlertTriangle className="size-5 text-amber-500" />,
    title: 'Fault Reporting',
    description: 'Anonymous or authenticated fault reporting with categories and location capture.',
    iconBg: 'icon-bg-amber',
  },
  {
    icon: <ClipboardList className="size-5 text-blue-600" />,
    title: 'Dispatch',
    description: 'Coordinator workflow for prioritizing work and assigning the right team.',
    iconBg: 'icon-bg-blue',
  },
  {
    icon: <Wrench className="size-5 text-emerald-600" />,
    title: 'Interventions',
    description: 'Status tracking, intervention history, and audit trail visibility.',
    iconBg: 'icon-bg-green',
  },
  {
    icon: <UserCheck className="size-5 text-violet-600" />,
    title: 'Assignments',
    description: 'Manual and automatic technician assignments with workload balancing.',
    iconBg: 'icon-bg-purple',
  },
  {
    icon: <BarChart2 className="size-5 text-indigo-600" />,
    title: 'Reports',
    description: 'Performance reviews, SLA compliance, and operational statistics.',
    iconBg: 'icon-bg-indigo',
  },
  {
    icon: <Shield className="size-5 text-rose-500" />,
    title: 'Administration',
    description: 'User management, company separation, and SLA rules.',
    iconBg: 'icon-bg-rose',
  },
];

const STACK = ['Next.js 15', 'React 19', 'TypeScript', 'Express', 'MySQL', 'Socket.IO', 'Tailwind CSS'];

const HIGHLIGHTS = [
  'Real-time updates via Socket.IO',
  'Role-based access for admins, coordinators, and technicians',
  'SLA tracking and automated escalations',
];

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const readAuthState = () => {
      setIsAuthenticated(Boolean(window.localStorage.getItem('token')));
    };

    readAuthState();
    window.addEventListener('storage', readAuthState);
    window.addEventListener('focus', readAuthState);

    return () => {
      window.removeEventListener('storage', readAuthState);
      window.removeEventListener('focus', readAuthState);
    };
  }, []);

  return (
    <div className="flex flex-col overflow-x-hidden">

      {/* Hero */}
      <section className="hero-section relative isolate min-h-[88vh] flex items-center border-b">
        {/* Dot grid overlay */}
        <div className="dot-grid absolute inset-0 opacity-60" />

        {/* Animated colour orbs */}
        <div className="bg-orb animate-float-orb-1 bg-blue-400/25 w-[520px] h-[520px] -top-32 -left-32" />
        <div className="bg-orb animate-float-orb-2 bg-violet-400/20 w-[420px] h-[420px] top-1/4 -right-28" />
        <div className="bg-orb animate-float-orb-3 bg-cyan-400/15 w-[340px] h-[340px] bottom-0 left-1/2" />

        {/* Bottom white fade */}
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-white to-transparent" />

        <div className="relative mx-auto flex w-full max-w-[var(--content-max-width)] flex-col items-center px-4 py-20 text-center md:px-6 md:py-32">

          <div className="mb-14 inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-white/80 backdrop-blur-sm px-5 py-2 text-xs font-semibold text-primary shadow-sm animate-fade-in-down">
            <Zap className="size-3.5 animate-pulse" />
            Service intervention management system
          </div>

          <h1
            className="mx-auto mb-14 flex max-w-5xl flex-col items-center gap-6 font-black tracking-tight text-foreground animate-fade-in-up md:gap-7"
            style={{ animationDelay: '80ms', fontSize: 'clamp(2.45rem, 6vw, 4.6rem)', lineHeight: '1.12' }}
          >
            <span>
              Service <span className="gradient-text">interventions</span>
            </span>
            <span className="text-foreground/80">under control</span>
          </h1>

          <ul
            className="mx-auto mb-16 flex w-full max-w-none flex-col items-center justify-center gap-4 animate-fade-in-up lg:flex-row lg:flex-nowrap lg:gap-7"
            style={{ animationDelay: '180ms' }}
          >
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center justify-center gap-2 text-center text-base text-muted-foreground md:whitespace-nowrap">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                {h}
              </li>
            ))}
          </ul>

          <div
            className="mt-6 flex flex-wrap items-center justify-center gap-6 animate-fade-in-up md:mt-8"
            style={{ animationDelay: '260ms' }}
          >
            <Button asChild size="lg" className="btn-glow h-12 px-7 text-base rounded-xl gap-2">
              <Link href={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}>
                {isAuthenticated ? 'Dashboard' : 'Login'}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            {isAuthenticated ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-7 text-base rounded-xl glass-card border-0 hover:shadow-md"
              >
                <Link href={ROUTES.INTERVENTIONS}>View Interventions</Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-7 text-base rounded-xl glass-card border-0 hover:shadow-md"
              >
                <Link href={ROUTES.FAULT_REPORTS}>Report a Fault</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto w-full max-w-[var(--content-max-width)] px-4 py-20 md:px-6">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl animate-fade-in-up">
            Everything you&nbsp;<span className="gradient-text">need</span>
          </h2>
          <p className="mt-3 text-muted-foreground animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            A complete toolkit for field intervention management.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="feature-card animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`mb-4 flex size-12 items-center justify-center rounded-xl ${feature.iconBg}`}>
                {feature.icon}
              </div>
              <h3 className="mb-2 text-base font-bold tracking-tight">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-b cta-strip">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-16 md:px-6 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-black tracking-tight mb-3 animate-fade-in-up">
              Ready to&nbsp;<span className="gradient-text">start?</span>
            </h2>
            <p
              className="text-muted-foreground mb-8 animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              Sign in and manage all interventions from one place.
            </p>
            <div
              className="flex flex-wrap justify-center gap-4 animate-fade-in-up"
              style={{ animationDelay: '180ms' }}
            >
              <Button asChild size="lg" className="btn-glow h-12 px-8 rounded-xl gap-2">
                <Link href={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}>
                  {isAuthenticated ? 'Dashboard' : 'Login'}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              {isAuthenticated ? (
                <Button asChild size="lg" variant="outline" className="h-12 px-8 rounded-xl glass-card border-0">
                  <Link href={ROUTES.PROFILE}>Profile</Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="outline" className="h-12 px-8 rounded-xl glass-card border-0">
                  <Link href={ROUTES.REGISTER}>Register</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="bg-muted/20">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-10 md:px-6">
          <p className="mb-5 text-center text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Tech stack
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {STACK.map((tech, i) => (
              <span
                key={tech}
                className="tech-pill rounded-full bg-background/90 px-4 py-1.5 text-xs font-semibold text-muted-foreground animate-fade-in-up"
                style={{ animationDelay: `${i * 55}ms` }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
