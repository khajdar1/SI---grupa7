import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return <div className={cn('page-layout mx-auto min-h-full w-full', className)}>{children}</div>;
}

export type { PageLayoutProps };
