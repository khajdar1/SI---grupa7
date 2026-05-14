export const runtime = 'edge';

import { ROUTES } from '@/constants';
import { PageHeader, PageLayout } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';

interface AdminDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminDetailsPage({ params }: AdminDetailsPageProps) {
  const { id } = await params;

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Admin Details"
        subtitle="Placeholder for record-specific administrative detail workflows."
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Admin', href: ROUTES.ADMIN },
          { label: id },
        ]}
      />

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Placeholder for admin record <strong>{id}</strong>. This route is scaffolded for future PBI implementation.
        </CardContent>
      </Card>
    </PageLayout>
  );
}
