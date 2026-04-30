'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';

import { API_ENDPOINTS, ROUTES } from '@/constants';
import { EmptyState, PageHeader, PageLayout, StatCard } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getModuleShell } from '@/services/module-shell.service';

export default function ReportsPage() {
  const [endpoints, setEndpoints] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModule = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getModuleShell(API_ENDPOINTS.REPORTS.BASE);
      setEndpoints(data?.endpoints ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load reports module.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadModule();
  }, []);

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Operational reporting and export preparation surface."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Reports' }]}
      />

      {error ? (
        <EmptyState title="Reports unavailable" description={error} action={{ label: 'Retry', onClick: loadModule }} />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Endpoints available" value={endpoints.length} isLoading={isLoading} />
        <StatCard title="Read operations" value={endpoints.filter((e) => e.startsWith('GET')).length} isLoading={isLoading} />
        <StatCard title="Write operations" value={endpoints.filter((e) => e.startsWith('POST')).length} isLoading={isLoading} />
        <StatCard title="Module state" value={endpoints.length > 0 ? 'READY' : 'EMPTY'} isLoading={isLoading} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Surface</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ) : endpoints.length > 0 ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {endpoints.map((endpoint) => (
                <li key={endpoint}>{endpoint}</li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No reporting data"
              description="Reporting module endpoint metadata is not available."
            />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
