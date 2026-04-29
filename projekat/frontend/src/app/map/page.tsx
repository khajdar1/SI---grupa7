export const runtime = 'edge';

import Link from 'next/link';

import { ROUTES } from '@/constants';
import { MAP_TAGS } from '@/constants/content';
import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function MapPage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Map"
        subtitle="Geospatial view for fault and intervention location clustering."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Map' }]}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            This screen will visualize fault and intervention locations to support dispatch planning.
          </p>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {MAP_TAGS.map((item) => (
              <span key={item} className="rounded-full border px-3 py-1">
                {item}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={ROUTES.ASSIGNMENTS}>View assignments</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={ROUTES.DASHBOARD}>Back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
