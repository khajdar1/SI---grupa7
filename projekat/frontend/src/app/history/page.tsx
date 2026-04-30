import { ROUTES } from '@/constants';
import { HISTORY_TAGS } from '@/constants/content';
import { ModuleSummaryCard, PageHeader, PageLayout } from '@/components/shared';

export const runtime = 'edge';

export default function HistoryPage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="History"
        subtitle="Timeline and audit-trail view of intervention lifecycle changes."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'History' }]}
      />

      <ModuleSummaryCard
        title="Intervention Timeline"
        description="This screen presents status changes, ownership updates, and event timeline context."
        tags={HISTORY_TAGS}
        primaryAction={{ label: 'View reports', href: ROUTES.REPORTS }}
        secondaryAction={{ label: 'Back to dashboard', href: ROUTES.DASHBOARD }}
      />
    </PageLayout>
  );
}
