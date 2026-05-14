'use client';
export const runtime = 'edge';

import { ROUTES } from '@/constants';
import { EmptyState, PageHeader, PageLayout } from '@/components/shared';

export default function MapPage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Map"
        subtitle="Location overview."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Map' }]}
      />

      <EmptyState
        title="Map view is not implemented"
        description="Use the interventions list for current dispatch planning."
        action={{
          label: 'Open interventions',
          onClick: () => {
            window.location.href = ROUTES.INTERVENTIONS;
          },
        }}
      />
    </PageLayout>
  );
}
