'use client';
export const runtime = 'edge';

import { ROUTES } from '@/constants';
import { EmptyState, PageHeader, PageLayout } from '@/components/shared';

export default function SettingsPage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Workspace settings."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Settings' }]}
      />

      <EmptyState
        title="Settings are not implemented"
        description="SLA and attachment configuration are available in the admin area."
        action={{
          label: 'Open admin area',
          onClick: () => {
            window.location.href = ROUTES.ADMIN;
          },
        }}
      />
    </PageLayout>
  );
}
