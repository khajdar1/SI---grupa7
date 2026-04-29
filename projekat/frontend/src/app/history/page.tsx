import { ROUTES } from '@/constants';
import { HISTORY_TAGS } from '@/constants/content';
import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export const runtime = 'edge';

export default function HistoryPage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="History"
        subtitle="Timeline and audit-trail view of intervention lifecycle changes."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'History' }]}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            This screen will present status changes, ownership updates, and event timeline context.
          </p>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {HISTORY_TAGS.map((item) => (
              <span key={item} className="rounded-full border px-3 py-1">
                {item}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={ROUTES.REPORTS}>View reports</Link>
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
