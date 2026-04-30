export const runtime = 'edge';

import { ROUTES } from '@/constants';
import { SETTINGS_TAGS } from '@/constants/content';
import { ModuleSummaryCard, PageHeader, PageLayout } from '@/components/shared';

export default function SettingsPage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configuration surface for SLA, language, and notification controls."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Settings' }]}
      />

      <ModuleSummaryCard
        title="Workspace Settings"
        description="This screen hosts SLA, language preferences, notification settings, and operational controls."
        tags={SETTINGS_TAGS}
        primaryAction={{ label: 'Open admin area', href: ROUTES.ADMIN }}
        secondaryAction={{ label: 'Back to dashboard', href: ROUTES.DASHBOARD }}
      />
    </PageLayout>
  );
}
