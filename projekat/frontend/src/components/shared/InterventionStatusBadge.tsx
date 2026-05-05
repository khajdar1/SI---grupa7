'use client';

import type { InterventionStatus } from '@shared/enums';
import { INTERVENTION_STATUS } from '@shared/enums';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusConfig = {
  label: string;
  bg: string;
  color: string;
};

const STATUS_CONFIG = {
  [INTERVENTION_STATUS.NEW]: {
    label: 'Otvoreno',
    bg: 'var(--status-new-bg)',
    color: 'var(--status-new)',
  },
  [INTERVENTION_STATUS.ASSIGNED]: {
    label: 'Dodijeljeno',
    bg: 'var(--status-assigned-bg)',
    color: 'var(--status-assigned)',
  },
  [INTERVENTION_STATUS.IN_PROGRESS]: {
    label: 'U procesu',
    bg: 'var(--status-in-progress-bg)',
    color: 'var(--status-in-progress)',
  },
  [INTERVENTION_STATUS.RESOLVED]: {
    label: 'Završeno',
    bg: 'var(--status-resolved-bg)',
    color: 'var(--status-resolved)',
  },
  [INTERVENTION_STATUS.CANCELLED]: {
    label: 'Otkazano',
    bg: 'var(--status-cancelled-bg)',
    color: 'var(--status-cancelled)',
  },
  [INTERVENTION_STATUS.REJECTED]: {
    label: 'Odbijeno',
    bg: 'var(--status-rejected-bg)',
    color: 'var(--status-rejected)',
  },
} as const satisfies Record<InterventionStatus, StatusConfig>;

interface InterventionStatusBadgeProps {
  status: InterventionStatus;
  className?: string;
}

export function InterventionStatusBadge({
  status,
  className,
}: InterventionStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const statusClassMap: Record<InterventionStatus, string> = {
    [INTERVENTION_STATUS.NEW]: 'status-token-new',
    [INTERVENTION_STATUS.ASSIGNED]: 'status-token-assigned',
    [INTERVENTION_STATUS.IN_PROGRESS]: 'status-token-in-progress',
    [INTERVENTION_STATUS.RESOLVED]: 'status-token-resolved',
    [INTERVENTION_STATUS.CANCELLED]: 'status-token-cancelled',
    [INTERVENTION_STATUS.REJECTED]: 'status-token-rejected',
  };

  return (
    <Badge className={cn('border-transparent font-medium', statusClassMap[status], className)}>
      {config.label}
    </Badge>
  );
}
