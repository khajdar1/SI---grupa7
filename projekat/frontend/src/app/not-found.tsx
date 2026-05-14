import Link from 'next/link';

import { ROUTES } from '@/constants';
import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Page Not Found"
        subtitle="The requested route does not exist yet in this implementation slice."
        breadcrumbs={[{ label: 'Home', href: ROUTES.HOME }, { label: '404' }]}
      />

      <Card className="max-w-xl">
        <CardHeader className="space-y-1">
          <CardTitle>Route not available</CardTitle>
          <CardDescription>This URL is not part of the currently deployed app surface.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
