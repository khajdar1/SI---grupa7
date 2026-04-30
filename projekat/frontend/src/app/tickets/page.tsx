export const runtime = 'edge';

import { ROUTES } from '@/constants';
import { TICKETS_TAGS } from '@/constants/content';
import { ModuleSummaryCard, PageHeader, PageLayout } from '@/components/shared';

export default function TicketsPage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Tickets"
        subtitle="Support ticket flow and messaging handoff workspace."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Tickets' }]}
      />

      <ModuleSummaryCard
        title="Support Tickets"
        description="This route covers ticket handling, message threads, and support-coordination workflows."
        tags={TICKETS_TAGS}
        primaryAction={{ label: 'Open fault intake', href: ROUTES.FAULT_REPORTS }}
        secondaryAction={{ label: 'Back to dashboard', href: ROUTES.DASHBOARD }}
      />
    </PageLayout>
  );
}
