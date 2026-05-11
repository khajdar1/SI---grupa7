'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { INTERVENTION_STATUS, type InterventionStatus } from '@shared/enums';

import { ROUTES } from '@/constants';
import {
  ConfirmDialog,
  DataTable,
  PageHeader,
  PageLayout,
  type PageHeaderAction,
} from '@/components/shared';
import { AssignedServicersSection } from '@/components/assignments/AssignedServicersSection';
import { CommentsSection } from '@/components/shared/CommentsSection';
import { ReportSection } from '@/components/reports/ReportSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InterventionStatusBadge } from '@/components/shared/InterventionStatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import {
  deleteAttachment,
  downloadAttachment,
  formatFileSize,
  getInterventionAttachments,
  type AttachmentListItem,
} from '@/services/attachments.service';
import {
  getInterventionById,
  updateInterventionStatus,
  type InterventionDetail,
} from '@/services/interventions.service';
import { hasSessionRole } from '../../../lib/auth';

const EDITABLE_STATUSES = new Set<InterventionStatus>([
  INTERVENTION_STATUS.NEW,
  INTERVENTION_STATUS.IN_PROGRESS,
]);

const STARTABLE_STATUSES = new Set<InterventionStatus>([
  INTERVENTION_STATUS.NEW,
  INTERVENTION_STATUS.ASSIGNED,
]);

const CLOSEABLE_STATUSES = new Set<InterventionStatus>([INTERVENTION_STATUS.IN_PROGRESS]);

const INTERVENTION_MANAGEMENT_ROLES = new Set([
  'koordinator',
  'coordinator',
  'admin',
  'administrator',
]);

const ADMIN_ATTACHMENT_ROLES = new Set(['admin', 'administrator']);

const STATUS_MANAGEMENT_ROLES = new Set([
  'koordinator',
  'coordinator',
  'serviser',
  'admin',
  'administrator',
]);

const REPORT_READ_ROLES = new Set([
  'koordinator',
  'coordinator',
  'admin',
  'administrator',
  'menadzment',
  'management',
  'serviser',
]);

const REPORT_WRITE_ROLES = new Set(['serviser']);

interface DeleteState {
  isOpen: boolean;
  attachmentId: number | null;
  fileName: string;
  isLoading: boolean;
}

const INITIAL_DELETE_STATE: DeleteState = {
  isOpen: false,
  attachmentId: null,
  fileName: '',
  isLoading: false,
};

export default function InterventionDetailPage() {
  const params = useParams();
  const interventionId = Number(params.id);

  const [intervention, setIntervention] = useState<InterventionDetail | null>(null);
  const [attachments, setAttachments] = useState<AttachmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [deleteState, setDeleteState] = useState<DeleteState>(INITIAL_DELETE_STATE);

  const isValidId = Number.isInteger(interventionId) && interventionId > 0;

  const loadData = async () => {
    if (!isValidId) {
      setError('Invalid intervention identifier.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [interventionData, attachmentData] = await Promise.all([
        getInterventionById(interventionId),
        getInterventionAttachments(interventionId),
      ]);
      setIntervention(interventionData);
      setAttachments(attachmentData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [interventionId]);

  const handleDownload = (attachment: AttachmentListItem) => {
    downloadAttachment(attachment.id, attachment.fileName).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to download attachment.');
    });
  };

  const handleStatusChange = async (status: InterventionStatus) => {
    if (!intervention) return;

    setIsUpdatingStatus(true);
    setError(null);
    setSuccessMessage('');

    try {
      const updated = await updateInterventionStatus(intervention.id, status);
      setIntervention((current) => ({
        ...updated,
        assignments: current?.assignments ?? updated.assignments,
      }));
      setSuccessMessage('Status updated.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openDeleteDialog = (attachment: AttachmentListItem) => {
    setDeleteState({
      isOpen: true,
      attachmentId: attachment.id,
      fileName: attachment.fileName,
      isLoading: false,
    });
  };

  const closeDeleteDialog = () => setDeleteState(INITIAL_DELETE_STATE);

  const handleConfirmDelete = async () => {
    if (!deleteState.attachmentId) return;

    setDeleteState((prev) => ({ ...prev, isLoading: true }));

    try {
      await deleteAttachment(deleteState.attachmentId);
      setAttachments((prev) =>
        prev.filter((a) => a.id !== deleteState.attachmentId),
      );
      setSuccessMessage(`Attachment '${deleteState.fileName}' was deleted successfully.`);
      closeDeleteDialog();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete attachment.');
      closeDeleteDialog();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB');
  };

  const canManageIntervention = hasSessionRole(INTERVENTION_MANAGEMENT_ROLES);
  const canDeleteAttachments = hasSessionRole(ADMIN_ATTACHMENT_ROLES);
  const canChangeStatus = hasSessionRole(STATUS_MANAGEMENT_ROLES);
  const canReadReport = hasSessionRole(REPORT_READ_ROLES);
  const canWriteReport = hasSessionRole(REPORT_WRITE_ROLES);

  const statusActions: PageHeaderAction[] = intervention
    ? [
        ...(canChangeStatus && STARTABLE_STATUSES.has(intervention.status)
          ? [
              {
                label: 'Start',
                onClick: () => {
                  void handleStatusChange(INTERVENTION_STATUS.IN_PROGRESS);
                },
                variant: 'outline' as const,
                isLoading: isUpdatingStatus,
              },
            ]
          : []),
        ...(canChangeStatus && CLOSEABLE_STATUSES.has(intervention.status)
          ? [
              {
                label: 'Close',
                onClick: () => {
                  void handleStatusChange(INTERVENTION_STATUS.RESOLVED);
                },
                variant: 'outline' as const,
                isLoading: isUpdatingStatus,
              },
            ]
          : []),
      ]
    : [];

  return (
    <PageLayout className="space-y-6">
      {/* ── Header ── */}
      <PageHeader
        title={`Intervention #${interventionId}`}
        subtitle="Intervention details, attachments and comments."
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Interventions', href: ROUTES.INTERVENTIONS },
          { label: `#${interventionId}` },
        ]}
        primaryAction={
          intervention &&
          canManageIntervention &&
          EDITABLE_STATUSES.has(intervention.status)
            ? {
                label: 'Edit',
                href: ROUTES.INTERVENTION_EDIT(String(interventionId)),
                variant: 'outline',
              }
            : undefined
        }
        secondaryActions={statusActions}
      />

      {/* ── Feedback messages ── */}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

      {/* ── Intervention details ── */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : intervention ? (
        <Card>
          <CardHeader>
            <CardTitle>{intervention.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <InterventionStatusBadge status={intervention.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Priority</p>
                <PriorityBadge priority={intervention.priority} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium">{intervention.categoryName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                <p className="font-medium">{intervention.companyName}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium">{intervention.location}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Creator</p>
                <p className="font-medium">{intervention.owner}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm">{intervention.description}</p>
            </div>

            {intervention.startedAt ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Started</p>
                  <p className="text-sm">
                    {new Date(intervention.startedAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className="text-sm">
                    {intervention.dueAt
                      ? new Date(intervention.dueAt).toLocaleDateString('en-GB')
                      : '-'}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* ── Assigned servicers ── */}
      {intervention ? (
        <AssignedServicersSection
          interventionId={interventionId}
          assignments={intervention.assignments ?? []}
          onAssignmentsChange={(assignments) => {
            setIntervention((current) => (current ? { ...current, assignments } : current));
          }}
          canManage={canManageIntervention}
        />
      ) : null}

      {/* ── PBI-010: Intervention report ── */}
      {intervention && (canReadReport || canWriteReport) ? (
        <ReportSection
          interventionId={interventionId}
          interventionStatus={intervention.status}
          canRead={canReadReport}
          canWrite={canWriteReport}
        />
      ) : null}

      {/* ── Attachments ── */}
      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <DataTable<AttachmentListItem>
              columns={[
                { key: 'fileName', header: 'File name' },
                { key: 'mimeType', header: 'Tip', width: '200px' },
                {
                  key: 'fileSize',
                  header: 'Size',
                  width: '100px',
                  render: (value) => formatFileSize(Number(value)),
                },
                {
                  key: 'createdAt',
                  header: 'Added',
                  width: '120px',
                  render: (value) => formatDate(String(value)),
                },
                {
                  key: 'id',
                  header: 'Actions',
                  width: '200px',
                  render: (_value, row) => (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(row)}
                      >
                        Download
                      </Button>
                      {canDeleteAttachments ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(row)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  ),
                },
              ]}
              data={attachments}
              keyExtractor={(row) => String(row.id)}
              isLoading={false}
              error={error}
              onRetry={loadData}
              emptyTitle="No attachments"
              emptyDescription="This intervention has no attachments."
            />
          )}
        </CardContent>
      </Card>

      {/* ── PBI-016: Intervention comments ── */}
      {isValidId ? <CommentsSection interventionId={interventionId} /> : null}

      {/* ── Delete attachment dialog ── */}
      <ConfirmDialog
        isOpen={deleteState.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        title="Delete attachment"
        description={`Are you sure you want to delete '${deleteState.fileName}'? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteState.isLoading}
      />
    </PageLayout>
  );
}