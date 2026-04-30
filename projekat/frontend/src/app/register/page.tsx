'use client';
export const runtime = 'edge';

import Link from 'next/link';

import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants';

import { getPasswordStrength } from './register.validation';
import { useRegister } from './useRegister';

export default function RegisterPage() {
  const {
    formData,
    errors,
    submitting,
    serverError,
    success,
    handleChange,
    handleSubmit,
  } = useRegister();

  const strength = getPasswordStrength(formData.password);
  const strengthColorClass =
    strength.level <= 1
      ? 'text-destructive'
      : strength.level === 2
        ? 'text-amber-600'
        : strength.level === 3
          ? 'text-blue-600'
          : 'text-emerald-600';

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Create Account"
        subtitle="Register to access the service intervention platform."
        breadcrumbs={[{ label: 'Home', href: ROUTES.HOME }, { label: 'Register' }]}
      />

      <Card className="max-w-3xl">
        <CardHeader className="space-y-1">
          <CardTitle>Create account</CardTitle>
          <CardDescription>Enter user details and set secure credentials.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          {success ? <p className="text-sm text-emerald-600">Registration successful. Redirecting...</p> : null}

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? 'register-firstName-error' : undefined}
              />
              {errors.firstName ? (
                <p id="register-firstName-error" className="text-xs text-destructive">
                  {errors.firstName}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? 'register-lastName-error' : undefined}
              />
              {errors.lastName ? (
                <p id="register-lastName-error" className="text-xs text-destructive">
                  {errors.lastName}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? 'register-username-error' : undefined}
              />
              {errors.username ? (
                <p id="register-username-error" className="text-xs text-destructive">
                  {errors.username}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'register-email-error' : undefined}
              />
              {errors.email ? (
                <p id="register-email-error" className="text-xs text-destructive">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password
                    ? 'register-password-error'
                    : formData.password
                      ? 'register-password-help'
                      : undefined
                }
              />
              {formData.password ? (
                <p id="register-password-help" className={`text-xs ${strengthColorClass}`}>
                  Password strength: {strength.label}
                </p>
              ) : null}
              {errors.password ? (
                <p id="register-password-error" className="text-xs text-destructive">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? 'register-confirmPassword-error' : undefined}
              />
              {errors.confirmPassword ? (
                <p id="register-confirmPassword-error" className="text-xs text-destructive">
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>

            <div className="col-span-full flex flex-wrap gap-2">
              <Button type="submit" disabled={submitting || success}>
                {submitting ? 'Creating...' : 'Create account'}
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
