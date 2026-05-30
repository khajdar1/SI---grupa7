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
import { KnowledgeBaseSection } from '@/components/interventions/KnowledgeBaseSection';
import { CommentsSection } from '@/components/shared/CommentsSection';
import { FeedbackSection } from '@/components/feedback/FeedbackSection';
import { ReportSection } from '@/components/reports/ReportSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InterventionStatusBadge } from '@/components/shared/InterventionStatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { translateLocationValue, translateText, useI18n } from '@/lib/i18n';
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
import { blockUser, getBlockedUsers, type BlockRecord } from '@/services/blocking.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getSessionUserId, hasSessionRole } from '../../../lib/auth';

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
  'supportagent',
  'agentpodrske',
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

const COORDINATOR_ROLES = new Set(['koordinator', 'coordinator', 'admin', 'administrator']);
const MAX_BLOCK_REASON_LENGTH = 1000;

interface BlockReporterState {
  isOpen: boolean;
  reason: string;
  isLoading: boolean;
  error: string | null;
}

const INITIAL_BLOCK_REPORTER_STATE: BlockReporterState = {
  isOpen: false,
  reason: '',
  isLoading: false,
  error: null,
};

export default function InterventionDetailPage() {
  const { language, t } = useI18n();
  const params = useParams();
  const interventionId = Number(params.id);

  const [intervention, setIntervention] = useState<InterventionDetail | null>(null);
  const [attachments, setAttachments] = useState<AttachmentListItem[]>([]);
  const [blocks, setBlocks] = useState<BlockRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [deleteState, setDeleteState] = useState<DeleteState>(INITIAL_DELETE_STATE);
  const [blockReporterState, setBlockReporterState] = useState<BlockReporterState>(INITIAL_BLOCK_REPORTER_STATE);

  const isCoordinator = hasSessionRole(COORDINATOR_ROLES);

  const isValidId = Number.isInteger(interventionId) && interventionId > 0;

  const loadData = async () => {
    if (!isValidId) {
      setError(t('interventionDetail.invalidId'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [interventionData, attachmentData, blockData] = await Promise.all([
        getInterventionById(interventionId),
        getInterventionAttachments(interventionId),
        isCoordinator ? getBlockedUsers() : Promise.resolve([]),
      ]);
      setIntervention(interventionData);
      setAttachments(attachmentData);
      setBlocks(blockData);
    } catch (err: unknown) {
      setError(err instanceof Error ? translateText(language, err.message) : t('interventionDetail.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [interventionId]);

  const handleDownload = (attachment: AttachmentListItem) => {
    downloadAttachment(attachment.id, attachment.fileName).catch((err: unknown) => {
      setError(err instanceof Error ? translateText(language, err.message) : t('interventionDetail.downloadFailed'));
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
      setSuccessMessage(t('interventionDetail.statusUpdated'));
    } catch (err: unknown) {
      setError(err instanceof Error ? translateText(language, err.message) : t('interventionDetail.statusUpdateFailed'));
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
      setSuccessMessage(t('interventionDetail.attachmentDeleted'));
      closeDeleteDialog();
    } catch (err: unknown) {
      setError(err instanceof Error ? translateText(language, err.message) : t('interventionDetail.deleteFailed'));
      closeDeleteDialog();
    }
  };

  const handleBlockReporter = async () => {
    const reporterUser = intervention?.faultReport?.reporterUser;
    if (!reporterUser || !blockReporterState.reason.trim()) return;
    if (reporterBlock) {
      setBlockReporterState((prev) => ({
        ...prev,
        error: 'Korisnik je vec blokiran za ovu kompaniju.',
      }));
      return;
    }

    setBlockReporterState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const newBlock = await blockUser({
        username: reporterUser.username,
        companyId: intervention.companyId,
        reason: blockReporterState.reason.trim(),
      });
      setBlocks((prev) => [newBlock, ...prev]);
      setBlockReporterState(INITIAL_BLOCK_REPORTER_STATE);
      setSuccessMessage(`User ${reporterUser.username} has been blocked.`);
    } catch (err: unknown) {
      setBlockReporterState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to block user.',
      }));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString(language === 'bs' ? 'bs-BA' : 'en-GB');
  };

  const canManageIntervention = hasSessionRole(INTERVENTION_MANAGEMENT_ROLES);
  const canDeleteAttachments = hasSessionRole(ADMIN_ATTACHMENT_ROLES);
  const canChangeStatus = hasSessionRole(STATUS_MANAGEMENT_ROLES);
  const canReadReport = hasSessionRole(REPORT_READ_ROLES);
  const canWriteReport = hasSessionRole(REPORT_WRITE_ROLES);
  const sessionUserId = getSessionUserId();
  const canSubmitFeedback = Boolean(
    intervention?.faultReport?.reporterUser?.id &&
      intervention.faultReport.reporterUser.id === sessionUserId,
  );
  const reporterUser = intervention?.faultReport?.reporterUser ?? null;
  const reporterBlock = reporterUser && intervention
    ? blocks.find(
        (block) =>
          block.companyId === intervention.companyId &&
          block.blockedUser.username.toLowerCase() === reporterUser.username.toLowerCase(),
      )
    : null;

  const statusActions: PageHeaderAction[] = intervention
    ? [
        ...(canChangeStatus && STARTABLE_STATUSES.has(intervention.status)
          ? [
              {
                label: t('interventionDetail.start'),
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
                label: t('interventionDetail.close'),
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
        title={t('interventionDetail.title').replace('{id}', String(interventionId))}
        subtitle={t('interventionDetail.subtitle')}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: ROUTES.DASHBOARD },
          { label: t('nav.interventions'), href: ROUTES.INTERVENTIONS },
          { label: `#${interventionId}` },
        ]}
        primaryAction={
          intervention &&
          canManageIntervention &&
          EDITABLE_STATUSES.has(intervention.status)
            ? {
                label: t('interventionDetail.edit'),
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
                <p className="text-xs text-muted-foreground">{t('interventionDetail.status')}</p>
                <InterventionStatusBadge status={intervention.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('interventionDetail.priority')}</p>
                <PriorityBadge priority={intervention.priority} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('interventionDetail.category')}</p>
                <p className="font-medium">{intervention.categoryName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('interventionDetail.company')}</p>
                <p className="font-medium">{intervention.companyName}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">{t('interventionDetail.location')}</p>
                <p className="font-medium">{translateLocationValue(language, intervention.location)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('interventionDetail.creator')}</p>
                <p className="font-medium">{intervention.owner}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">{t('interventionDetail.description')}</p>
              <p className="text-sm">{intervention.description}</p>
            </div>

            {intervention.startedAt ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t('interventionDetail.started')}</p>
                  <p className="text-sm">
                    {new Date(intervention.startedAt).toLocaleString(language === 'bs' ? 'bs-BA' : 'en-GB', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('interventionDetail.due')}</p>
                  <p className="text-sm">
                    {intervention.dueAt
                      ? new Date(intervention.dueAt).toLocaleDateString(language === 'bs' ? 'bs-BA' : 'en-GB')
                      : '-'}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* ── Fault report reporter / block action ── */}
      {isCoordinator && intervention?.faultReport?.reporterUser ? (
        <Card>
          <CardHeader>
            <CardTitle>Reporter prijave kvara</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">
                {intervention.faultReport.reporterUser.firstName}{' '}
                {intervention.faultReport.reporterUser.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                @{intervention.faultReport.reporterUser.username}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={Boolean(reporterBlock)}
              onClick={() =>
                setBlockReporterState((prev) => ({ ...prev, isOpen: true }))
              }
            >
              {reporterBlock ? 'Korisnik je vec blokiran' : 'Blokiraj korisnika'}
            </Button>
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

      {/* PBI-055: Knowledge base and recommended solutions */}
      {intervention && (canReadReport || canWriteReport) ? (
        <KnowledgeBaseSection interventionId={interventionId} />
      ) : null}

      {/* ── PBI-010: Intervention report ── */}
      {intervention && (canReadReport || canWriteReport) ? (
        <ReportSection
          interventionId={interventionId}
          interventionStatus={intervention.status}
          canRead={canReadReport}
          canWrite={canWriteReport}
          canRecommend={canManageIntervention}
        />
      ) : null}

      {/* PBI-036: User feedback after resolved intervention */}
      {intervention ? (
        <FeedbackSection
          interventionId={interventionId}
          interventionStatus={intervention.status}
          canRead={canManageIntervention}
          canSubmit={canSubmitFeedback}
        />
      ) : null}

      {/* ── Attachments ── */}
      <Card>
        <CardHeader>
          <CardTitle>{t('interventionDetail.attachments')}</CardTitle>
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
                { key: 'fileName', header: t('interventionDetail.fileName') },
                { key: 'mimeType', header: t('interventionDetail.type'), width: '200px' },
                {
                  key: 'fileSize',
                  header: t('interventionDetail.size'),
                  width: '100px',
                  render: (value) => formatFileSize(Number(value)),
                },
                {
                  key: 'createdAt',
                  header: t('interventionDetail.added'),
                  width: '120px',
                  render: (value) => formatDate(String(value)),
                },
                {
                  key: 'id',
                  header: t('interventionDetail.actions'),
                  width: '200px',
                  render: (_value, row) => (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(row)}
                      >
                        {t('interventionDetail.download')}
                      </Button>
                      {canDeleteAttachments ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(row)}
                        >
                          {t('interventionDetail.delete')}
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
              emptyTitle={t('interventionDetail.noAttachments')}
              emptyDescription={t('interventionDetail.noAttachmentsDescription')}
            />
          )}
        </CardContent>
      </Card>

      {/* ── PBI-016: Intervention comments ── */}
      {isValidId ? <CommentsSection interventionId={interventionId} /> : null}

      {/* ── Block reporter dialog ── */}
      <Dialog
        open={blockReporterState.isOpen}
        onOpenChange={(open) =>
          !open && setBlockReporterState(INITIAL_BLOCK_REPORTER_STATE)
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blokiraj reportera</DialogTitle>
            <DialogDescription>
              Korisnik{' '}
              <strong>
                {intervention?.faultReport?.reporterUser?.username}
              </strong>{' '}
              neće moći podnositi nove prijave kvarova vašoj kompaniji.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="block-reason-intervention">Razlog blokiranja</Label>
            <Textarea
              id="block-reason-intervention"
              placeholder="Opišite razlog blokiranja..."
              maxLength={MAX_BLOCK_REASON_LENGTH}
              rows={3}
              value={blockReporterState.reason}
              onChange={(e) =>
                setBlockReporterState((prev) => ({
                  ...prev,
                  reason: e.target.value,
                  error: null,
                }))
              }
            />
            {blockReporterState.error && (
              <p className="text-destructive text-sm">{blockReporterState.error}</p>
            )}
            {!blockReporterState.error && reporterBlock ? (
              <p className="text-destructive text-sm">
                Korisnik je vec blokiran za ovu kompaniju.
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBlockReporterState(INITIAL_BLOCK_REPORTER_STATE)}
              disabled={blockReporterState.isLoading}
            >
              Odustani
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleBlockReporter();
              }}
              disabled={blockReporterState.isLoading || !blockReporterState.reason.trim() || Boolean(reporterBlock)}
            >
              {blockReporterState.isLoading ? 'Blokiranje...' : 'Blokiraj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete attachment dialog ── */}
      <ConfirmDialog
        isOpen={deleteState.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        title={t('interventionDetail.deleteAttachment')}
        description={t('interventionDetail.deleteAttachmentDescription')}
        confirmLabel={t('interventionDetail.delete')}
        cancelLabel={t('tickets.cancel')}
        variant="danger"
        isLoading={deleteState.isLoading}
      />
    </PageLayout>
  );
}
