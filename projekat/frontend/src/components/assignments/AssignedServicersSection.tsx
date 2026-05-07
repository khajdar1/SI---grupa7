'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssignerModal } from './AssignerModal';
import {
  getInterventionAssignments,
  removeServicerAssignment,
} from '@/services/assignment.service';
import { useState } from 'react';
import { X, Users } from 'lucide-react';

export interface AssignedServicer {
  id: number;
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
  };
  assignedAt: string;
}

export interface AssignedServicersSectionProps {
  interventionId: number;
  assignments: AssignedServicer[];
  onAssignmentsChange: (assignments: AssignedServicer[]) => void;
  canManage?: boolean;
}

/**
 * AssignedServicersSection
 * Displays assigned servicers for an intervention with ability to manage assignments
 */
export function AssignedServicersSection({
  interventionId,
  assignments,
  onAssignmentsChange,
  canManage = false,
}: AssignedServicersSectionProps) {
  const [isAssignerModalOpen, setIsAssignerModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRemoveServicer = async (userId: number) => {
    setIsRemoving(userId);
    setError(null);

    try {
      await removeServicerAssignment(interventionId, userId);
      onAssignmentsChange(
        assignments.filter((a) => a.userId !== userId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove servicer');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleAssignmentsChange = async (): Promise<void> => {
    const refreshedAssignments = await getInterventionAssignments(interventionId);
    onAssignmentsChange(refreshedAssignments);
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('bs-BA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigned Servicers
          </CardTitle>
          {canManage && (
            <Button
              onClick={() => setIsAssignerModalOpen(true)}
              variant="outline"
              size="sm"
            >
              Manage
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No servicers assigned yet.
              {canManage && ' Click "Manage" to assign servicers.'}
            </p>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {assignment.user.firstName} {assignment.user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {assignment.user.username}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Assigned {formatDateTime(assignment.assignedAt)}
                    </div>
                  </div>
                  {canManage && (
                    <Button
                      onClick={() => handleRemoveServicer(assignment.userId)}
                      disabled={isRemoving === assignment.userId}
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      title="Remove servicer"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AssignerModal
        interventionId={interventionId}
        isOpen={isAssignerModalOpen}
        onClose={() => setIsAssignerModalOpen(false)}
        onSave={handleAssignmentsChange}
        currentAssignedUserIds={assignments.map((a) => a.userId)}
      />
    </>
  );
}
