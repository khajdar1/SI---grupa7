import Link from 'next/link';

import { ROUTES } from '@/constants';
import { HOME_CAPABILITY_CARDS, HOME_STACK_PILLS } from '@/constants/content';
import { PageHeader, PageLayout, StatCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Service Intervention Platform"
        subtitle="A structured launchpad for service intervention management implementation."
        breadcrumbs={[{ label: 'Home' }]}
        primaryAction={{ label: 'Open login', href: ROUTES.LOGIN }}
        secondaryActions={[
          { label: 'Fault reports', href: ROUTES.FAULT_REPORTS, variant: 'outline' },
          { label: 'Dashboard', href: ROUTES.DASHBOARD, variant: 'outline' },
        ]}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Core MVP streams" value="05" />
        <StatCard title="Backend module routes" value="21" />
        <StatCard title="Workspaces in monorepo" value="02" />
        <StatCard title="Shared runtime setup" value="01" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Core Modules</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {HOME_CAPABILITY_CARDS.map((card) => (
              <div key={card.title} className="rounded-lg border p-3">
                <p className="font-medium">{card.title}</p>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {HOME_STACK_PILLS.map((item) => (
                <span key={item} className="rounded-full border px-3 py-1">
                  {item}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Frontend uses Next.js App Router and backend exposes modular typed Express services.
            </p>
            <Button asChild variant="outline">
              <Link href={ROUTES.REPORTS}>Explore reports shell</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </PageLayout>
  );
}
