'use client';

import { Card, CardContent } from '@/components/ui/card';
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

const deltaColorByDirection: Record<NonNullable<StatCardProps['delta']>['direction'], string> = {
  up: 'text-emerald-600',
  down: 'text-red-500',
  neutral: 'text-muted-foreground',
};

export function StatCard({ title, value, delta, icon, isLoading = false, onClick }: StatCardProps) {
  return (
    <Card
      className={cn(
        'border border-slate-200/70 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden',
        'shadow-[0_2px_14px_rgba(15,23,42,0.05)] transition-all duration-300',
        onClick ? 'cursor-pointer stat-card-glow' : undefined,
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
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 rounded-lg" />
            ) : (
              <p className="text-3xl font-black tabular-nums text-foreground">{value}</p>
            )}
            {delta && !isLoading ? (
              <p className={cn('mt-1.5 text-xs font-semibold', deltaColorByDirection[delta.direction])}>
                {delta.value > 0 ? '+' : ''}
                {delta.value} {delta.label}
              </p>
            ) : null}
          </div>
          {icon ? (
            <div className="icon-bg-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
              {icon}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export type { StatCardProps };
