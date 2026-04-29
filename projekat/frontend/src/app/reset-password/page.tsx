'use client';
export const runtime = 'edge';

import Link from 'next/link';

import { ROUTES } from '@/constants';
import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useResetPassword } from './useResetPassword';

export default function ResetPasswordPage() {
  const { email, setEmail, submitting, message, handleSubmit } = useResetPassword();

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Reset Password"
        subtitle="Submit your email to receive a reset link."
        breadcrumbs={[{ label: 'Home', href: ROUTES.HOME }, { label: 'Reset Password' }]}
      />

      <Card className="max-w-xl">
        <CardContent className="space-y-5 pt-6">
          {message ? (
            <p className={message.type === 'error' ? 'text-sm text-destructive' : 'text-sm text-emerald-600'}>
              {message.text}
            </p>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
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
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send reset link'}
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
