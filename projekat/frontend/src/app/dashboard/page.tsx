'use client';
import { useEffect, useState } from 'react';

import { ROUTES } from '@/constants';
import { EmptyState, PageHeader, PageLayout, StatCard } from '@/components/shared';
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

      {!isLoading && !error ? (
        <EmptyState
          title="Role dashboard not configured"
          description="Role-specific dashboard content is intentionally left empty until that workflow is implemented."
        />
      ) : null}
    </PageLayout>
  );
}
