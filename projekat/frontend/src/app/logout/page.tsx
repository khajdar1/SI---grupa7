'use client';
export const runtime = 'edge';

import { useEffect } from 'react';

import { ROUTES } from '@/constants';
import { PageHeader, PageLayout } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useLogin } from '../login/useLogin';

export default function LogoutPage() {
  const { handleLogout } = useLogin();

  useEffect(() => {
    void handleLogout();
  }, [handleLogout]);

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Logout"
        subtitle="Ending active session and redirecting to login."
        breadcrumbs={[{ label: 'Home', href: ROUTES.HOME }, { label: 'Logout' }]}
      />
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Session end</CardTitle>
          <CardDescription>Your active session is being closed.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Logging out...</CardContent>
      </Card>
    </PageLayout>
  );
}
