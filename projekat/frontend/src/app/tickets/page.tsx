'use client';
export const runtime = 'edge';

import { ROUTES } from '@/constants';
import { EmptyState, PageHeader, PageLayout } from '@/components/shared';

export default function TicketsPage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Tickets"
        subtitle="Support tickets."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Tickets' }]}
      />

      <EmptyState
        title="Ticket workspace is not implemented"
        description="Fault intake is available for new service requests."
        action={{
          label: 'Open fault intake',
          onClick: () => {
            window.location.href = ROUTES.FAULT_REPORTS;
          },
        }}
      />
    </PageLayout>
  );
}
