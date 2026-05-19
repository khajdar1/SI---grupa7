'use client';

import { useEffect, useState } from 'react';

import type { InterventionStatus } from '@shared/enums';
import { INTERVENTION_STATUS } from '@shared/enums';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BulkActionPayload, BulkActionResponse } from '@/services/interventions.service';
import {
  buildBulkAssignServicer,
  buildBulkStatusChange,
  executeBulkAction,
} from '@/services/interventions.service';
import type { InterventionListItem } from '@/services/interventions.service';
import {
  getAvailableServicers,
  type ServicerLoad,
} from '@/services/assignment.service';

export interface BulkActionToolbarProps {
  selectedIds: number[];
  selectedRows: InterventionListItem[];
  onClearSelection: () => void;
  onActionComplete: (
    result: BulkActionResponse,
    action: 'STATUS_CHANGE' | 'ASSIGN_SERVICER',
  ) => void;
  onError: (message: string) => void;
}

const STATUS_OPTIONS: { value: InterventionStatus; label: string }[] = [
  { value: INTERVENTION_STATUS.IN_PROGRESS, label: 'In Progress' },
  { value: INTERVENTION_STATUS.RESOLVED,    label: 'Resolved' },
  { value: INTERVENTION_STATUS.CANCELLED,   label: 'Cancelled' },
];

type PendingAction =
  | { type: 'STATUS_CHANGE'; status: InterventionStatus }
  | { type: 'ASSIGN_SERVICER'; userId: number; label: string };

function describeAction(action: PendingAction, count: number): string {
  const plural = count !== 1 ? 's' : '';
  switch (action.type) {
    case 'STATUS_CHANGE':
      return `Change status to "${action.status}" for ${count} selected intervention${plural}? This action will only proceed if all selected interventions can be updated.`;
    case 'ASSIGN_SERVICER':
      return `Assign "${action.label}" to ${count} selected intervention${plural}? This action will only proceed if all selected interventions can be updated.`;
  }
}

export function BulkActionToolbar({
  selectedIds,
  selectedRows,
  onClearSelection,
  onActionComplete,
  onError,
}: BulkActionToolbarProps) {
  const [pendingAction, setPendingAction]       = useState<PendingAction | null>(null);
  const [isExecuting, setIsExecuting]           = useState(false);
  const [selectedStatus, setSelectedStatus]     = useState<string | null>(null);
  const [selectedServicer, setSelectedServicer] = useState<string | null>(null);
  const [servicers, setServicers]               = useState<ServicerLoad[]>([]);

  // Učitaj servisere čim se pojavi selekcija, koristeći prvi interventionId.
  // Backend /available endpoint interno uzima companyId intervencije i vraća
  // servisere te kompanije — ne trebamo ništa dodatno proslijediti.
  useEffect(() => {
    const interventionId = Number(selectedIds[0]);
    if (!interventionId) return;

    getAvailableServicers(interventionId)
      .then(setServicers)
      .catch(() => setServicers([]));
  }, [selectedIds[0]]);

  if (selectedIds.length === 0) return null;

  const count = selectedIds.length;

  const handleConfirm = async () => {
    if (!pendingAction) return;

    const actionType = pendingAction.type;
    setIsExecuting(true);

    try {
      let payload: BulkActionPayload;

      switch (pendingAction.type) {
        case 'STATUS_CHANGE':
          payload = buildBulkStatusChange(selectedIds, pendingAction.status);
          break;
        case 'ASSIGN_SERVICER':
          payload = buildBulkAssignServicer(selectedIds, pendingAction.userId);
          break;
      }

      const result = await executeBulkAction(payload);
      onActionComplete(result, actionType);

      if (result.totalSkipped === 0) {
        onClearSelection();
        setSelectedStatus(null);
        setSelectedServicer(null);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Bulk action failed. Please try again.');
    } finally {
      setIsExecuting(false);
      setPendingAction(null);
    }
  };

  const handleApply = () => {
    if (selectedStatus) {
      setPendingAction({ type: 'STATUS_CHANGE', status: selectedStatus as InterventionStatus });
      return;
    }

    if (selectedServicer) {
      const servicer = servicers.find((s) => String(s.id) === selectedServicer);
      if (!servicer) return;
      setPendingAction({
        type: 'ASSIGN_SERVICER',
        userId: servicer.id,
        label: `${servicer.firstName} ${servicer.lastName}`.trim(),
      });
    }
  };

  return (
    <>
      <div
        role="toolbar"
        aria-label="Bulk actions toolbar"
        className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-foreground/10 bg-card px-4 py-3 text-sm text-card-foreground shadow-sm ring-1 ring-foreground/10"
      >
        <span className="font-medium text-foreground">
          {count} intervention{count !== 1 ? 's' : ''} selected
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-3">

          {/* Promjena statusa */}
          <Select
            value={selectedStatus ?? ''}
            onValueChange={(v) => { setSelectedStatus(v || null); setSelectedServicer(null); }}
          >
            <SelectTrigger size="sm" className="w-40 text-xs" aria-label="Select new status">
              <SelectValue placeholder="Change status…" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Dodjela servisera — prikazuje se samo ako ih ima */}
          {servicers.length > 0 && (
            <Select
              value={selectedServicer ?? ''}
              onValueChange={(v) => { setSelectedServicer(v || null); setSelectedStatus(null); }}
            >
              <SelectTrigger size="sm" className="w-44 text-xs" aria-label="Select servicer">
                <SelectValue placeholder="Assign servicer…" />
              </SelectTrigger>
              <SelectContent>
                {servicers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.firstName} {s.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApply}
            disabled={!selectedStatus && !selectedServicer}
            aria-label="Apply selected bulk action"
          >
            Apply
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            aria-label="Clear selection"
          >
            Clear
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={() => { void handleConfirm(); }}
        title="Confirm bulk action"
        description={pendingAction ? describeAction(pendingAction, count) : ''}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        variant="default"
        isLoading={isExecuting}
      />
    </>
  );
}