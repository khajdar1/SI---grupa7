export const runtime = 'edge';

import Link from 'next/link';

import { ROUTES } from '@/constants';
import { SETTINGS_TAGS } from '@/constants/content';
import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configuration surface for SLA, language, and notification controls."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Settings' }]}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            This screen will host SLA, language preferences, notification settings, and other controls.
          </p>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {SETTINGS_TAGS.map((item) => (
              <span key={item} className="rounded-full border px-3 py-1">
                {item}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={ROUTES.ADMIN}>Open admin area</Link>
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
