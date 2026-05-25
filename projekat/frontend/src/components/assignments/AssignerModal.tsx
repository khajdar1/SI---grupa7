'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  getAvailableServicers,
  assignServicers,
  type ServicerLoad,
} from '@/services/assignment.service';
import { translateText, useI18n } from '@/lib/i18n';

export interface AssignerModalProps {
  interventionId: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignedUserIds: number[]) => void;
  currentAssignedUserIds?: number[];
}

/**
 * AssignerModal
 * Modal for assigning servicers to an intervention
 * Shows servicers sorted by active intervention count (least burdened first)
 */
export function AssignerModal({
  interventionId,
  isOpen,
  onClose,
  onSave,
  currentAssignedUserIds = [],
}: AssignerModalProps) {
  const { language, t } = useI18n();
  const [servicers, setServicers] = useState<ServicerLoad[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(
    new Set(currentAssignedUserIds),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize selected servicers from current assignments
  useEffect(() => {
    if (!isOpen) return;

    const loadServicers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAvailableServicers(interventionId);
        setServicers(data);
        // Initialize selected servicers from current assignments
        setSelectedUserIds(new Set(currentAssignedUserIds));
      } catch (err) {
        setError(
          err instanceof Error ? translateText(language, err.message) : t('assignments.noActiveServicers'),
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadServicers();
  }, [isOpen, interventionId, currentAssignedUserIds]);

  const handleSelectServicer = (userId: number, checked: boolean) => {
    const newSelected = new Set(selectedUserIds);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSave = async () => {
    if (selectedUserIds.size === 0) {
      setError(t('assignments.selectOne'));
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const userIds = Array.from(selectedUserIds);
      await assignServicers(interventionId, userIds);
      onSave(userIds);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? translateText(language, err.message) : t('profile.updateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('assignments.assignServicers')}</DialogTitle>
          <DialogDescription>
            {t('assignments.assignDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            </div>
          ) : servicers.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              {t('assignments.noActiveServicers')}
            </div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto border rounded-md p-3">
              {servicers.map((servicer) => (
                <div
                  key={servicer.id}
                  className="flex items-center space-x-3 rounded hover:bg-gray-50 p-2"
                >
                  <input
                    id={`servicer-${servicer.id}`}
                    type="checkbox"
                    checked={selectedUserIds.has(servicer.id)}
                    onChange={(e) =>
                      handleSelectServicer(servicer.id, e.target.checked)
                    }
                    disabled={isSaving}
                    className="h-4 w-4 cursor-pointer accent-blue-600"
                  />
                  <label
                    htmlFor={`servicer-${servicer.id}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    <div className="font-medium">
                      {servicer.firstName} {servicer.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {servicer.username}
                    </div>
                  </label>
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {servicer.activeInterventionCount} {t('assignments.active')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('tickets.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || selectedUserIds.size === 0 || isLoading}
          >
            {isSaving ? t('common.saving') : `${t('assignments.assign')} (${selectedUserIds.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
