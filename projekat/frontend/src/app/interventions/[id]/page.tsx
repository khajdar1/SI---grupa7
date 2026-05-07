'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { ROUTES } from '@/constants';
import { ConfirmDialog, DataTable, PageHeader, PageLayout } from '@/components/shared';
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
  type InterventionDetail,
} from '@/services/interventions.service';

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
                <p className="font-medium">{intervention.category.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                <p className="font-medium">{intervention.company.name}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium">{intervention.location}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Creator</p>
                <p className="font-medium">{intervention.creator.username}</p>
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
          canManage={true}
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
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(row)}
                      >
                        Obriši
                      </Button>
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
