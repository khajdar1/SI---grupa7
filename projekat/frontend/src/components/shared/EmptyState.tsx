'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-8 text-center',
        className,
      )}
    >
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <p className="text-base font-medium">{title}</p>
      {description ? <p className="max-w-lg text-sm text-muted-foreground">{description}</p> : null}
      {action ? (
        <Button onClick={action.onClick} type="button">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export type { EmptyStateProps };
