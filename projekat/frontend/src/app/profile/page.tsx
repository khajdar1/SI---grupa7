export const runtime = 'edge';

import Link from 'next/link';

import { ROUTES } from '@/constants';
import { PROFILE_TAGS } from '@/constants/content';
import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ProfilePage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Self-service profile and account management surface."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Profile' }]}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            This route will cover profile edits, password updates, and personal preferences.
          </p>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {PROFILE_TAGS.map((item) => (
              <span key={item} className="rounded-full border px-3 py-1">
                {item}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={ROUTES.SETTINGS}>Open settings</Link>
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
