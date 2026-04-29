'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';

import { ROUTES } from '@/constants';
import { TARGET_USER_ROLES } from '@/constants/content';
import { EmptyState, PageHeader, PageLayout, StatCard } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardSnapshot, type DashboardSnapshot } from '@/services/dashboard.service';

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDashboardSnapshot();
      setSnapshot(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of current operations and system activity."
        breadcrumbs={[{ label: 'Home', href: ROUTES.HOME }, { label: 'Dashboard' }]}
      />

      {error ? (
        <EmptyState title="Dashboard unavailable" description={error} action={{ label: 'Retry', onClick: loadDashboard }} />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(snapshot?.stats ?? []).map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} isLoading={isLoading} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {(snapshot?.activity.length ?? 0) > 0 ? (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {snapshot?.activity.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recent module activity reported.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target Users</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {TARGET_USER_ROLES.map((role) => (
              <span key={role} className="rounded-full border px-3 py-1">
                {role}
              </span>
            ))}
          </CardContent>
        </Card>
      </section>
    </PageLayout>
  );
}
