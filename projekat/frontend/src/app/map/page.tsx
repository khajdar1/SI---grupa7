export const runtime = 'edge';

import { ROUTES } from '@/constants';
import { MAP_TAGS } from '@/constants/content';
import { ModuleSummaryCard, PageHeader, PageLayout } from '@/components/shared';

export default function MapPage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Map"
        subtitle="Geospatial view for fault and intervention location clustering."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Map' }]}
      />

      <ModuleSummaryCard
        title="Geo Dispatch View"
        description="This screen visualizes fault and intervention locations to support dispatch planning."
        tags={MAP_TAGS}
        primaryAction={{ label: 'View assignments', href: ROUTES.ASSIGNMENTS }}
        secondaryAction={{ label: 'Back to dashboard', href: ROUTES.DASHBOARD }}
      />
    </PageLayout>
  );
}
