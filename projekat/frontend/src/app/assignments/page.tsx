'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';

import { API_ENDPOINTS, ROUTES } from '@/constants';
import { ASSIGNMENT_TOOLS } from '@/constants/content';
import { EmptyState, PageHeader, PageLayout } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getModuleShell } from '@/services/module-shell.service';

export default function AssignmentsPage() {
  const [endpoints, setEndpoints] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModule = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getModuleShell(API_ENDPOINTS.ASSIGNMENTS.BASE);
      setEndpoints(data?.endpoints ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load assignments module.');
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
        title="Assignments"
        subtitle="Dispatch planning for technicians and coordinators."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Assignments' }]}
      />

      {error ? (
        <EmptyState title="Assignments unavailable" description={error} action={{ label: 'Retry', onClick: loadModule }} />
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Technician Load</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : endpoints.length > 0 ? (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {endpoints.map((endpoint) => (
                  <li key={endpoint}>{endpoint}</li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No assignment data"
                description="Assignment module endpoint metadata is not available."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Tools</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {ASSIGNMENT_TOOLS.map((item) => (
              <span key={item} className="rounded-full border px-3 py-1">
                {item}
              </span>
            ))}
          </CardContent>
        </Card>
      </section>
    </PageLayout>
  );
}
