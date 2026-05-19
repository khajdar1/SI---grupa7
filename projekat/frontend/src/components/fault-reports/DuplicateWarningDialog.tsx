'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants';
import type { PotentialDuplicateItem } from '@/models/FaultReport';

interface DuplicateWarningDialogProps {
  open: boolean;
  duplicates: PotentialDuplicateItem[];
  onContinue: () => void;
  onCancel: () => void;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    NEW: 'New',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In progress',
    RESOLVED: 'Resolved',
    CANCELLED: 'Cancelled',
    REJECTED: 'Rejected',
  };
  return map[status] ?? status;
}

function statusVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (['RESOLVED', 'CANCELLED', 'REJECTED'].includes(status)) return 'secondary';
  if (status === 'IN_PROGRESS') return 'default';
  return 'outline';
}

export function DuplicateWarningDialog({
  open,
  duplicates,
  onContinue,
  onCancel,
}: DuplicateWarningDialogProps) {
  const top = duplicates[0];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <DialogTitle className="text-amber-700">
              Potential duplicate report
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            The system detected{' '}
            {duplicates.length === 1
              ? 'a similar report'
              : `${duplicates.length} similar reports`}{' '}
            at the same location from the same user in the last 48 hours. Please check
            the status before creating a new report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {duplicates.map((dup) => (
            <div
              key={dup.interventionId}
              className="rounded-md border p-3 space-y-1 bg-amber-50/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Intervention #{dup.interventionId}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge variant={statusVariant(dup.status)} className="text-xs">
                    {statusLabel(dup.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {dup.similarityScore}% match
                  </span>
                </div>
              </div>

              <p className="text-sm font-medium truncate" title={dup.location}>
                {dup.location || '(location not provided)'}
              </p>

              {dup.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {dup.description}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Reported: {formatDate(dup.reportedAt)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {top && (
            <Button asChild variant="outline" size="sm">
              <Link href={ROUTES.INTERVENTION(String(top.interventionId))}>
                View existing intervention
              </Link>
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel report
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={onContinue}
            >
              Submit anyway
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
