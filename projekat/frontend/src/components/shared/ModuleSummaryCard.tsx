import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ModuleSummaryCardAction {
  label: string;
  href: string;
}

interface ModuleSummaryCardProps {
  title: string;
  description: string;
  tags?: readonly string[];
  primaryAction: ModuleSummaryCardAction;
  secondaryAction?: ModuleSummaryCardAction;
}

export function ModuleSummaryCard({
  title,
  description,
  tags,
  primaryAction,
  secondaryAction,
}: ModuleSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {tags.map((item) => (
              <span key={item} className="rounded-full border px-3 py-1">
                {item}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={primaryAction.href}>{primaryAction.label}</Link>
          </Button>
          {secondaryAction ? (
            <Button asChild variant="outline">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export type { ModuleSummaryCardAction, ModuleSummaryCardProps };
