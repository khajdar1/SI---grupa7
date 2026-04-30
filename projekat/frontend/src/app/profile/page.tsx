export const runtime = 'edge';

import { ROUTES } from '@/constants';
import { PROFILE_TAGS } from '@/constants/content';
import { ModuleSummaryCard, PageHeader, PageLayout } from '@/components/shared';

export default function ProfilePage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Self-service profile and account management surface."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Profile' }]}
      />

      <ModuleSummaryCard
        title="User Profile"
        description="This route covers profile edits, password updates, and personal preferences."
        tags={PROFILE_TAGS}
        primaryAction={{ label: 'Open settings', href: ROUTES.SETTINGS }}
        secondaryAction={{ label: 'Back to dashboard', href: ROUTES.DASHBOARD }}
      />
    </PageLayout>
  );
}
