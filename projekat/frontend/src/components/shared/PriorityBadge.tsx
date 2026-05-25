'use client';

import type { Priority } from '@shared/enums';
import { PRIORITY } from '@shared/enums';

import { Badge } from '@/components/ui/badge';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type PriorityConfig = {
  label: string;
  bg: string;
  color: string;
};

const PRIORITY_CONFIG = {
  [PRIORITY.LOW]: {
    label: 'Nizak',
    bg: 'var(--priority-low-bg)',
    color: 'var(--priority-low)',
  },
  [PRIORITY.MEDIUM]: {
    label: 'Normalan',
    bg: 'var(--priority-medium-bg)',
    color: 'var(--priority-medium)',
  },
  [PRIORITY.HIGH]: {
    label: 'Visok',
    bg: 'var(--priority-high-bg)',
    color: 'var(--priority-high)',
  },
  [PRIORITY.CRITICAL]: {
    label: 'Hitan',
    bg: 'var(--priority-critical-bg)',
    color: 'var(--priority-critical)',
  },
} as const satisfies Record<Priority, PriorityConfig>;

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const { t } = useI18n();
  const config = PRIORITY_CONFIG[priority];
  const labelKeys: Record<Priority, TranslationKey> = {
    [PRIORITY.LOW]: 'priority.low',
    [PRIORITY.MEDIUM]: 'priority.medium',
    [PRIORITY.HIGH]: 'priority.high',
    [PRIORITY.CRITICAL]: 'priority.critical',
  };
  const priorityClassMap: Record<Priority, string> = {
    [PRIORITY.LOW]: 'priority-token-low',
    [PRIORITY.MEDIUM]: 'priority-token-medium',
    [PRIORITY.HIGH]: 'priority-token-high',
    [PRIORITY.CRITICAL]: 'priority-token-critical',
  };

  return (
    <Badge className={cn('border-transparent font-medium', priorityClassMap[priority], className)}>
      {priority === PRIORITY.CRITICAL && (
        <span className="priority-critical-dot size-1.5 rounded-full animate-pulse" aria-hidden="true" />
      )}
      {labelKeys[priority] ? t(labelKeys[priority]) : config.label}
    </Badge>
  );
}
