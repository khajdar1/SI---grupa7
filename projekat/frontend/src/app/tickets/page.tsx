export const runtime = 'edge';

import Link from 'next/link';

import { ROUTES } from '@/constants';
import { TICKETS_TAGS } from '@/constants/content';
import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function TicketsPage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Tickets"
        subtitle="Support ticket flow and messaging handoff workspace."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Tickets' }]}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            This route covers ticket handling, message threads, and support-coordination workflows.
          </p>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {TICKETS_TAGS.map((item) => (
              <span key={item} className="rounded-full border px-3 py-1">
                {item}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={ROUTES.FAULT_REPORTS}>Open fault intake</Link>
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
