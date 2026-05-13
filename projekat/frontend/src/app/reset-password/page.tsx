'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { AlertCircle, CheckCircle2, KeyRound, Wrench } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants';

import { useResetPassword } from './useResetPassword';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const {
    email,
    setEmail,
    errors,
    submitting,
    message,
    handleSubmit,
    passwordData,
    setPasswordData,
    handleConfirmSubmit,
  } = useResetPassword();
  const isConfirmMode = Boolean(token);

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
            <p className="mt-1 text-xs text-muted-foreground">Intervention management system</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-7">
          <div className="mb-1 flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            <h1 className="text-xl font-black tracking-tight">
              {isConfirmMode ? 'New password' : 'Forgot password'}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {isConfirmMode
              ? 'Enter and confirm your new password.'
              : 'Enter your email address and we will send you a reset link.'}
          </p>

          {message ? (
            <div className={`mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
              message.type === 'error'
                ? 'border-destructive/30 bg-destructive/5 text-destructive'
                : 'border-emerald-300/40 bg-emerald-50 text-emerald-700'
            }`}>
              {message.type === 'error'
                ? <AlertCircle className="size-4 mt-0.5 shrink-0" />
                : <CheckCircle2 className="size-4 mt-0.5 shrink-0" />}
              {message.text}
            </div>
          ) : null}

          <form
            className="space-y-5"
            onSubmit={
              isConfirmMode
                ? (event) => handleConfirmSubmit(event, token, () => {
                    window.setTimeout(() => router.replace(ROUTES.LOGIN), 1500);
                  })
                : handleSubmit
            }
            noValidate
          >
            {isConfirmMode ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    value={passwordData.password}
                    onChange={(event) => setPasswordData('password', event.target.value)}
                    required
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'reset-password-error' : undefined}
                  />
                  {errors.password ? (
                    <p id="reset-password-error" className="flex items-center gap-1 text-xs text-destructive">
                      <span>&bull;</span> {errors.password}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={passwordData.confirmPassword}
                    onChange={(event) => setPasswordData('confirmPassword', event.target.value)}
                    required
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? 'reset-confirm-password-error' : undefined}
                  />
                  {errors.confirmPassword ? (
                    <p id="reset-confirm-password-error" className="flex items-center gap-1 text-xs text-destructive">
                      <span>&bull;</span> {errors.confirmPassword}
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'reset-email-error' : undefined}
                />
                {errors.email ? (
                  <p id="reset-email-error" className="flex items-center gap-1 text-xs text-destructive">
                    <span>&bull;</span> {errors.email}
                  </p>
                ) : null}
              </div>
            )}

            <Button
              type="submit"
              className="btn-glow w-full h-11 rounded-xl text-base font-semibold"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" />
                  {isConfirmMode ? 'Saving...' : 'Sending...'}
                </span>
              ) : (
                isConfirmMode ? 'Reset password' : 'Send link'
              )}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            <Link href={ROUTES.LOGIN} className="font-semibold text-primary hover:underline transition-colors">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
