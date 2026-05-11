import Link from 'next/link';
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
    title: 'Prijava kvarova',
    description: 'Anonimna ili prijavljena prijava kvarova s kategorizacijom i lokacijom.',
    iconBg: 'icon-bg-amber',
  },
  {
    icon: <ClipboardList className="size-5 text-blue-600" />,
    title: 'Dispečing',
    description: 'Koordinatorski radni tok za prioritizaciju i raspoređivanje tima.',
    iconBg: 'icon-bg-blue',
  },
  {
    icon: <Wrench className="size-5 text-emerald-600" />,
    title: 'Intervencije',
    description: 'Praćenje statusa, historija intervencija i vidljivost revizijskog traga.',
    iconBg: 'icon-bg-green',
  },
  {
    icon: <UserCheck className="size-5 text-violet-600" />,
    title: 'Dodjele',
    description: 'Manualna i automatska dodjela serviserima s balansiranjem opterećenja.',
    iconBg: 'icon-bg-purple',
  },
  {
    icon: <BarChart2 className="size-5 text-indigo-600" />,
    title: 'Izvještaji',
    description: 'Pregledi učinkovitosti, SLA poštivanje i operativne statistike.',
    iconBg: 'icon-bg-indigo',
  },
  {
    icon: <Shield className="size-5 text-rose-500" />,
    title: 'Upravljanje',
    description: 'Upravljanje korisnicima, segregacija kompanija i SLA pravila.',
    iconBg: 'icon-bg-rose',
  },
];

const STACK = ['Next.js 15', 'React 19', 'TypeScript', 'Express', 'MySQL', 'Socket.IO', 'Tailwind CSS'];

const HIGHLIGHTS = [
  'Real-time notifikacije via Socket.IO',
  'Role-based pristup (Admin, Koordinator, Serviser)',
  'SLA praćenje i automatske eskalacije',
];

export default function HomePage() {
  return (
    <div className="flex flex-col overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="hero-section relative isolate min-h-[88vh] flex items-center border-b">
        {/* Dot grid overlay */}
        <div className="dot-grid absolute inset-0 opacity-60" />

        {/* Animated colour orbs */}
        <div className="bg-orb animate-float-orb-1 bg-blue-400/25 w-[520px] h-[520px] -top-32 -left-32" />
        <div className="bg-orb animate-float-orb-2 bg-violet-400/20 w-[420px] h-[420px] top-1/4 -right-28" />
        <div className="bg-orb animate-float-orb-3 bg-cyan-400/15 w-[340px] h-[340px] bottom-0 left-1/2" />

        {/* Bottom white fade */}
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-white to-transparent" />

        <div className="relative mx-auto w-full max-w-[var(--content-max-width)] px-4 py-20 text-center md:px-6 md:py-28">

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-primary shadow-sm animate-fade-in-down">
            <Zap className="size-3.5 animate-pulse" />
            Sistem za upravljanje servisnim intervencijama
          </div>

          {/* Heading */}
          <h1
            className="mb-5 font-black tracking-tight text-foreground animate-fade-in-up"
            style={{ animationDelay: '80ms', fontSize: 'clamp(2.8rem, 8vw, 5.5rem)', lineHeight: '1.06' }}
          >
            Servisne&nbsp;
            <span className="gradient-text">intervencije</span>
            <br />
            <span className="text-foreground/80">pod kontrolom</span>
          </h1>

          {/* Subtitle */}
          <p
            className="mx-auto mb-10 max-w-xl text-base text-muted-foreground md:text-lg leading-relaxed animate-fade-in-up"
            style={{ animationDelay: '180ms' }}
          >
            Jedna platforma za prijavu kvarova, dispečing serviserima,
            praćenje statusa i generisanje izvještaja u realnom vremenu.
          </p>

          {/* Feature highlights */}
          <ul
            className="mx-auto mb-10 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6 animate-fade-in-up"
            style={{ animationDelay: '260ms' }}
          >
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                {h}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div
            className="flex flex-wrap items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: '340ms' }}
          >
            <Button asChild size="lg" className="btn-glow h-12 px-7 text-base rounded-xl gap-2">
              <Link href={ROUTES.LOGIN}>
                Prijava
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-7 text-base rounded-xl glass-card border-0 hover:shadow-md"
            >
              <Link href={ROUTES.FAULT_REPORTS}>Prijavi kvar</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="mx-auto w-full max-w-[var(--content-max-width)] px-4 py-20 md:px-6">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl animate-fade-in-up">
            Sve što vam&nbsp;<span className="gradient-text">treba</span>
          </h2>
          <p className="mt-3 text-muted-foreground animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Kompletan set alata za upravljanje terenskim intervencijama.
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

      {/* ── CTA strip ── */}
      <section className="border-t border-b cta-strip">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-16 md:px-6 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-black tracking-tight mb-3 animate-fade-in-up">
              Spremni za&nbsp;<span className="gradient-text">početak?</span>
            </h2>
            <p
              className="text-muted-foreground mb-8 animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              Prijavite se i upravljajte svim intervencijama na jednom mjestu.
            </p>
            <div
              className="flex flex-wrap justify-center gap-4 animate-fade-in-up"
              style={{ animationDelay: '180ms' }}
            >
              <Button asChild size="lg" className="btn-glow h-12 px-8 rounded-xl gap-2">
                <Link href={ROUTES.LOGIN}>
                  Prijava
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 rounded-xl glass-card border-0">
                <Link href={ROUTES.REGISTER}>Registracija</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tech stack ── */}
      <section className="bg-muted/20">
        <div className="mx-auto max-w-[var(--content-max-width)] px-4 py-10 md:px-6">
          <p className="mb-5 text-center text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Tehnički stack
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
