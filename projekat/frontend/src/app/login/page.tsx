'use client';

import Link from 'next/link';
import { AlertCircle, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants';

import { useLogin } from './useLogin';

export default function LoginPage() {
  const { formData, errors, submitting, serverError, handleChange, handleSubmit } = useLogin();

  return (
    <div className="auth-layout relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50" />
      <div className="dot-grid absolute inset-0 opacity-40" />
      <div className="bg-orb animate-float-orb-1 bg-blue-400/20 w-80 h-80 -top-20 -left-20" />
      <div className="bg-orb animate-float-orb-2 bg-violet-400/18 w-64 h-64 bottom-8 -right-10" />
      <div className="bg-orb animate-float-orb-3 bg-cyan-400/12 w-48 h-48 top-1/2 left-4" />

      <div className="relative w-full max-w-[400px] animate-scale-in">

        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="logo-mark pulse-glow flex size-16 items-center justify-center rounded-2xl text-white">
            <Wrench className="size-8" />
          </div>
          <div>
            <p className="text-2xl font-black tracking-tight gradient-text">ServisIS</p>
            <p className="mt-1 text-xs text-muted-foreground">Sistem za upravljanje intervencijama</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-7">
          <h1 className="text-xl font-black tracking-tight mb-1">Dobrodošli nazad</h1>
          <p className="text-sm text-muted-foreground mb-6">Unesite vaše pristupne podatke za nastavak.</p>

          {serverError ? (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              {serverError}
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-semibold">
                Korisničko ime
              </Label>
              <Input
                id="username"
                type="text"
                name="username"
                autoComplete="username"
                placeholder="jdoe"
                value={formData.username}
                onChange={handleChange}
                className="h-11 rounded-xl border-slate-200 bg-white/90 focus-visible:ring-primary/30 focus-visible:border-primary/60"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? 'login-username-error' : undefined}
              />
              {errors.username ? (
                <p id="login-username-error" className="flex items-center gap-1 text-xs text-destructive">
                  <span>•</span> {errors.username}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold">
                  Lozinka
                </Label>
                <Link
                  href={ROUTES.RESET_PASSWORD}
                  className="text-xs font-medium text-primary/80 transition-colors hover:text-primary hover:underline"
                >
                  Zaboravili ste lozinku?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="h-11 rounded-xl border-slate-200 bg-white/90 focus-visible:ring-primary/30 focus-visible:border-primary/60"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
              />
              {errors.password ? (
                <p id="login-password-error" className="flex items-center gap-1 text-xs text-destructive">
                  <span>•</span> {errors.password}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="btn-glow w-full h-11 rounded-xl text-base font-semibold"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" />
                  Prijavljivanje...
                </span>
              ) : (
                'Prijava'
              )}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            Nemate račun?{' '}
            <Link href={ROUTES.REGISTER} className="font-semibold text-primary hover:underline transition-colors">
              Registrujte se
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
