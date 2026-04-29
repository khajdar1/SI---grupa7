export const runtime = 'edge';

import Link from 'next/link';

import { ROUTES } from '@/constants';
import { ADMIN_SYSTEM_TAGS } from '@/constants/content';
import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
          <CardHeader>
            <CardTitle>User Governance</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Create or deactivate user accounts.</li>
              <li>Bind accounts to a company or organization.</li>
              <li>Adjust access according to documented roles.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Tuning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {ADMIN_SYSTEM_TAGS.map((item) => (
                <span key={item} className="rounded-full border px-3 py-1">
                  {item}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={ROUTES.ADMIN_CATEGORY}>Manage Categories</Link>
              </Button>
              <Button asChild>
                <Link href={ROUTES.ADMIN_SLA_CONFIG}>Configure SLA</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </PageLayout>
  );
}
