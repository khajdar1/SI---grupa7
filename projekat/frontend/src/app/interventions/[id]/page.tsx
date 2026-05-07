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
import { CommentsSection } from '@/components/shared/CommentsSection';
import { AssignedServicersSection } from '@/components/assignments/AssignedServicersSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { InterventionStatusBadge } from '@/components/shared/InterventionStatusBadge';
import {
  getInterventionAttachments,
  deleteAttachment,
  downloadAttachment,
  formatFileSize,
  type AttachmentListItem,
} from '@/services/attachments.service';
import {
  getInterventionById,
  updateInterventionStatus,
  type InterventionDetail,
} from '@/services/interventions.service';

const EDITABLE_STATUSES = new Set<InterventionStatus>([
  INTERVENTION_STATUS.NEW,
  INTERVENTION_STATUS.IN_PROGRESS,
]);
const STARTABLE_STATUSES = new Set<InterventionStatus>([
  INTERVENTION_STATUS.NEW,
  INTERVENTION_STATUS.ASSIGNED,
]);
const CLOSEABLE_STATUSES = new Set<InterventionStatus>([
  INTERVENTION_STATUS.IN_PROGRESS,
]);
const INTERVENTION_MANAGEMENT_ROLES = new Set([
  'koordinator',
  'coordinator',
  'admin',
  'administrator',
]);
const ADMIN_ATTACHMENT_ROLES = new Set([
  'admin',
  'administrator',
]);
const STATUS_MANAGEMENT_ROLES = new Set([
  'koordinator',
  'coordinator',
  'serviser',
  'admin',
  'administrator',
]);

type KeycloakTokenPayload = {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
};

function decodeTokenPayload(token: string): KeycloakTokenPayload | null {
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded)) as KeycloakTokenPayload;
  } catch {
    return null;
  }
}

function getSessionRoles(): Set<string> {
  if (typeof window === 'undefined') return new Set();

  const roles = new Set<string>();
  const rawUser = window.localStorage.getItem('user');
  const token = window.localStorage.getItem('token');

  try {
    if (rawUser) {
      const user = JSON.parse(rawUser) as { role?: string; roles?: string[] };
      if (user.role) roles.add(user.role.toLowerCase());
      user.roles?.forEach((role) => roles.add(role.toLowerCase()));
    }
  } catch {
    // ignore malformed local session state
  }

  if (token) {
    const payload = decodeTokenPayload(token);
    payload?.realm_access?.roles?.forEach((role) => roles.add(role.toLowerCase()));
    Object.values(payload?.resource_access ?? {}).forEach((client) =>
      client.roles?.forEach((role) => roles.add(role.toLowerCase())),
    );
  }

  return roles;
}

function hasSessionRole(allowedRoles: Set<string>): boolean {
  const roles = getSessionRoles();
  return Array.from(roles).some((role) => allowedRoles.has(role));
}

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
  const [deleteState, setDeleteState] = useState<DeleteState>(INITIAL_DELETE_STATE);
  const [successMessage, setSuccessMessage] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadData = async () => {
    if (!Number.isInteger(interventionId) || interventionId <= 0) {
      setError('Invalid intervention identifier.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const [interventionData, attachmentData] = await Promise.all([
        getInterventionById(interventionId),
        getInterventionAttachments(interventionId),
      ]);
      setIntervention(interventionData);
      setAttachments(attachmentData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load data.');
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

    try {
      setIsUpdatingStatus(true);
      setError(null);
      setSuccessMessage('');
      const updatedIntervention = await updateInterventionStatus(intervention.id, status);
      setIntervention((current) => ({
        ...updatedIntervention,
        assignments: current?.assignments ?? updatedIntervention.assignments,
      }));
      setSuccessMessage('Status updated.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to update status.');
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

  const closeDeleteDialog = () => {
    setDeleteState(INITIAL_DELETE_STATE);
  };

  const handleConfirmDelete = async () => {
    if (!deleteState.attachmentId) return;

    setDeleteState((prev) => ({ ...prev, isLoading: true }));

    try {
      await deleteAttachment(deleteState.attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== deleteState.attachmentId));
      setSuccessMessage(`Attachment '${deleteState.fileName}' was deleted successfully.`);
      closeDeleteDialog();
    } catch (requestError) {
      setDeleteState((prev) => ({ ...prev, isLoading: false }));
      setError(requestError instanceof Error ? requestError.message : 'Failed to delete attachment.');
      closeDeleteDialog();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('bs-BA');
  };

  const canManageIntervention = hasSessionRole(INTERVENTION_MANAGEMENT_ROLES);
  const canDeleteAttachments = hasSessionRole(ADMIN_ATTACHMENT_ROLES);
  const canChangeStatus = hasSessionRole(STATUS_MANAGEMENT_ROLES);
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
      <PageHeader
        title={`Intervencija #${interventionId}`}
        subtitle="Detalji intervencije, priloženi fajlovi i komentari."
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Intervencije', href: ROUTES.INTERVENTIONS },
          { label: `#${interventionId}` },
        ]}
        primaryAction={
          intervention && canManageIntervention && EDITABLE_STATUSES.has(intervention.status)
            ? {
                label: 'Edit',
                href: ROUTES.INTERVENTION_EDIT(String(interventionId)),
                variant: 'outline',
              }
            : undefined
        }
        secondaryActions={statusActions}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

      {/* Intervention Details */}
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

            {intervention.startedAt && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Started</p>
                  <p className="text-sm">{new Date(intervention.startedAt).toLocaleDateString('bs-BA')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className="text-sm">{intervention.dueAt ? new Date(intervention.dueAt).toLocaleDateString('bs-BA') : '-'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Assigned Servicers */}
      {intervention && (
        <AssignedServicersSection
          interventionId={interventionId}
          assignments={intervention.assignments || []}
          onAssignmentsChange={(assignments) => {
            if (intervention) {
              setIntervention({ ...intervention, assignments });
            }
          }}
          canManage={canManageIntervention}
        />
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Priloženi fajlovi</CardTitle>
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
                { key: 'fileName', header: 'Naziv fajla' },
                { key: 'mimeType', header: 'Tip', width: '200px' },
                {
                  key: 'fileSize',
                  header: 'Veličina',
                  width: '100px',
                  render: (value) => formatFileSize(Number(value)),
                },
                {
                  key: 'createdAt',
                  header: 'Dodano',
                  width: '120px',
                  render: (value) => formatDate(String(value)),
                },
                {
                  key: 'id',
                  header: 'Akcije',
                  width: '200px',
                  render: (_value, row) => (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(row)}
                      >
                        Preuzmi
                      </Button>
                      {canDeleteAttachments ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(row)}
                        >
                          Obriši
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
              emptyTitle="Nema fajlova"
              emptyDescription="Ova intervencija nema priloženih fajlova."
            />
          )}
        </CardContent>
      </Card>

      {/* ── PBI-016: Komentari intervencije ── */}
      {Number.isInteger(interventionId) && interventionId > 0 && (
        <CommentsSection interventionId={interventionId} />
      )}

      <ConfirmDialog
        isOpen={deleteState.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={() => { void handleConfirmDelete(); }}
        title="Obriši fajl"
        description={`Da li ste sigurni da želite obrisati '${deleteState.fileName}'? Ova akcija se ne može poništiti.`}
        confirmLabel="Obriši"
        cancelLabel="Otkaži"
        variant="danger"
        isLoading={deleteState.isLoading}
      />
    </PageLayout>
  );
}
