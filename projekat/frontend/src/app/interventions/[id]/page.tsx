'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { ROUTES } from '@/constants';
import { ConfirmDialog, DataTable, PageHeader, PageLayout } from '@/components/shared';
import { CommentsSection } from '@/components/shared/CommentsSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getInterventionAttachments,
  deleteAttachment,
  downloadAttachment,
  formatFileSize,
  type AttachmentListItem,
} from '@/services/attachments.service';

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

  const [attachments, setAttachments] = useState<AttachmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(INITIAL_DELETE_STATE);
  const [successMessage, setSuccessMessage] = useState('');

  const loadAttachments = async () => {
    if (!Number.isInteger(interventionId) || interventionId <= 0) {
      setError('Invalid intervention identifier.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getInterventionAttachments(interventionId);
      setAttachments(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load attachments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAttachments();
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
              onRetry={loadAttachments}
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
