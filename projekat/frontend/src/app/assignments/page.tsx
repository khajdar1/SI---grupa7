'use client';
export const runtime = 'edge';

import { ROUTES } from '@/constants';
import { EmptyState, PageHeader, PageLayout } from '@/components/shared';

export default function AssignmentsPage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Assignments"
        subtitle="Technician assignment management."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Assignments' }]}
      />

      <EmptyState
        title="Assignment overview not implemented"
        description="Assignments can currently be managed from intervention details."
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
