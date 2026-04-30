export const runtime = 'edge';

import { ROUTES } from '@/constants';
import { ADMIN_SYSTEM_TAGS } from '@/constants/content';
import { ModuleSummaryCard, PageHeader, PageLayout } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Admin"
        subtitle="User governance, category maintenance, and SLA tuning surface."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Admin' }]}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>User Governance</CardTitle>
            <CardDescription>Access, lifecycle, and organization mapping for platform users.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Create or deactivate user accounts.</li>
              <li>Bind accounts to a company or organization.</li>
              <li>Adjust access according to documented roles.</li>
            </ul>
          </CardContent>
        </Card>

        <ModuleSummaryCard
          title="System Tuning"
          description="Operational controls for taxonomy and SLA rule maintenance."
          tags={ADMIN_SYSTEM_TAGS}
          primaryAction={{ label: 'Manage Categories', href: ROUTES.ADMIN_CATEGORY }}
          secondaryAction={{ label: 'Configure SLA', href: ROUTES.ADMIN_SLA_CONFIG }}
        />
      </section>
    </PageLayout>
  );
}
