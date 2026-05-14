'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'destructive';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  primaryAction?: PageHeaderAction;
  secondaryActions?: PageHeaderAction[];
  className?: string;
}

function ActionButton({ action }: { action: PageHeaderAction }) {
  const content = (
    <>
      {action.icon}
      {action.isLoading ? 'Loading...' : action.label}
    </>
  );

  if (action.href) {
    return (
      <Button variant={action.variant ?? 'default'} asChild disabled={action.isLoading}>
        <Link href={action.href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={action.variant ?? 'default'}
      onClick={action.onClick}
      disabled={action.isLoading}
    >
      {content}
    </Button>
  );
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('space-y-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={`${breadcrumb.label}-${index}`} className="flex items-center gap-1">
              {breadcrumb.href ? (
                <Link href={breadcrumb.href} className="hover:text-foreground">
                  {breadcrumb.label}
                </Link>
              ) : (
                <span>{breadcrumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 ? <span>/</span> : null}
            </div>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>

        {(primaryAction || (secondaryActions && secondaryActions.length > 0)) ? (
          <div className="flex flex-wrap items-center gap-2">
            {secondaryActions?.map((action, index) => (
              <ActionButton key={`${action.label}-${index}`} action={action} />
            ))}
            {primaryAction ? <ActionButton action={primaryAction} /> : null}
          </div>
        ) : null}
      </div>

      <Separator />
    </header>
  );
}

export type { Breadcrumb, PageHeaderAction, PageHeaderProps };
