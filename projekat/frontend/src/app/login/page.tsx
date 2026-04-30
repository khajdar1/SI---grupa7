'use client';
export const runtime = 'edge';

import Link from 'next/link';

import { ROUTES } from '@/constants';
import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useLogin } from './useLogin';

export default function LoginPage() {
  const { formData, submitting, serverError, handleChange, handleSubmit } = useLogin();

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Login"
        subtitle="Enter your credentials to access the platform."
        breadcrumbs={[{ label: 'Home', href: ROUTES.HOME }, { label: 'Login' }]}
      />

      <Card className="max-w-xl">
        <CardHeader className="space-y-1">
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your account credentials to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                name="username"
                autoComplete="username"
                placeholder="jdoe"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Signing in...' : 'Sign in'}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href={ROUTES.RESET_PASSWORD}>Reset password</Link>
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href={ROUTES.REGISTER}>Create account</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
