'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  delta?: { value: number; label: string; direction: 'up' | 'down' | 'neutral' };
  icon?: React.ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
}

const deltaColorByDirection: Record<
  NonNullable<StatCardProps['delta']>['direction'],
  string
> = {
  up: 'text-emerald-600',
  down: 'text-red-600',
  neutral: 'text-muted-foreground',
};

export function StatCard({
  title,
  value,
  delta,
  icon,
  isLoading = false,
  onClick,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'border bg-card transition-colors',
        onClick ? 'cursor-pointer hover:bg-muted/40' : undefined,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <CardHeader className="flex flex-row items-start justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-3xl font-semibold">{value}</p>}
        {delta ? (
          <p className={cn('text-sm', deltaColorByDirection[delta.direction])}>
            {delta.value > 0 ? '+' : ''}
            {delta.value} {delta.label}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export type { StatCardProps };
