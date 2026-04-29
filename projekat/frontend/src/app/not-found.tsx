import Link from 'next/link';

import { ROUTES } from '@/constants';
import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFound() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Page Not Found"
        subtitle="The requested route does not exist yet in this implementation slice."
        breadcrumbs={[{ label: 'Home', href: ROUTES.HOME }, { label: '404' }]}
      />

      <Card className="max-w-xl">
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Navigation currently includes future routes so the application shell can grow without structural churn.
          </p>
          <Button asChild>
            <Link href={ROUTES.HOME}>Return Home</Link>
          </Button>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
