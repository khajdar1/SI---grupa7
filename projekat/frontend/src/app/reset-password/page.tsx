'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <PageLayout className="space-y-6">
      <PageHeader
        title="Forgot Password"
        subtitle={isConfirmMode ? 'Set a new password for your account.' : 'If you forgot your password, submit your email to receive a reset link.'}
        breadcrumbs={[{ label: 'Home', href: ROUTES.HOME }, { label: 'Forgot Password' }]}
      />

      <Card className="max-w-xl">
        <CardHeader className="space-y-1">
          <CardTitle>{isConfirmMode ? 'Set new password' : 'Password reset'}</CardTitle>
          <CardDescription>
            {isConfirmMode
              ? 'Enter and confirm your new password.'
              : 'We will send a reset link to the provided email.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {message ? (
            <p className={message.type === 'error' ? 'text-sm text-destructive' : 'text-sm text-emerald-600'}>
              {message.text}
            </p>
          ) : null}

          <form
            className="space-y-4"
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
                    <p id="reset-password-error" className="text-xs text-destructive">
                      {errors.password}
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
                    <p id="reset-confirm-password-error" className="text-xs text-destructive">
                      {errors.confirmPassword}
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                  <p id="reset-email-error" className="text-xs text-destructive">
                    {errors.email}
                  </p>
                ) : null}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isConfirmMode ? 'Reset password' : 'Send reset link'}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href={ROUTES.LOGIN}>Back to login</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
