'use client';

import Link from 'next/link';
import { ShieldOff, LogIn, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';

interface AccessDeniedProps {
  reason?: 'unauthenticated' | 'unauthorized';
  requiredRole?: string;
}

export function AccessDenied({ reason = 'unauthenticated', requiredRole = 'Admin' }: AccessDeniedProps) {
  if (reason === 'unauthenticated') {
    return (
      <div className="flex min-h-[68vh] flex-col items-center justify-center px-4 text-center animate-fade-in-up">
        {/* Icon with glow */}
        <div className="relative mb-8">
          <div className="absolute -inset-5 rounded-3xl bg-gradient-to-br from-primary/8 to-violet-500/8 blur-2xl" />
          <div className="relative flex size-24 items-center justify-center rounded-3xl icon-bg-blue shadow-[0_8px_28px_rgba(37,99,235,0.18)]">
            <LogIn className="size-11 text-primary" aria-hidden="true" />
          </div>
        </div>

        <h1 className="mb-3 text-3xl font-black tracking-tight">
          Access <span className="gradient-text">denied</span>
        </h1>
        <p className="mb-8 max-w-sm text-muted-foreground leading-relaxed">
          You must be signed in to access this page.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild className="btn-glow h-11 rounded-xl px-6">
            <Link href={ROUTES.LOGIN}>
              <LogIn className="mr-2 size-4" aria-hidden="true" />
              Login
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-11 rounded-xl px-6 glass-card border-0">
            <Link href={ROUTES.HOME}>
              <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
              Back
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[68vh] flex-col items-center justify-center px-4 text-center animate-fade-in-up">
      {/* Icon with glow */}
      <div className="relative mb-8">
        <div className="absolute -inset-5 rounded-3xl bg-gradient-to-br from-rose-500/8 to-orange-400/8 blur-2xl" />
        <div className="relative flex size-24 items-center justify-center rounded-3xl icon-bg-rose shadow-[0_8px_28px_rgba(244,63,94,0.18)]">
          <ShieldOff className="size-11 text-rose-500" aria-hidden="true" />
        </div>
      </div>

      <h1 className="mb-3 text-3xl font-black tracking-tight">Access denied</h1>
      <p className="mb-2 max-w-sm text-muted-foreground leading-relaxed">
        You do not have permission to access this page.
      </p>
      <p className="mb-8 max-w-sm text-xs text-muted-foreground">
        Required role:{' '}
        <span className="rounded-md bg-rose-50 px-2 py-0.5 font-semibold text-rose-600">
          {requiredRole}
        </span>
      </p>

      <Button variant="outline" asChild className="h-11 rounded-xl px-6 glass-card border-0">
        <Link href={ROUTES.HOME}>
          <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
          Back to home
        </Link>
      </Button>
    </div>
  );
}

export type { AccessDeniedProps };
