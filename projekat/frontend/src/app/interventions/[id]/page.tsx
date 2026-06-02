'use client';
export const runtime = 'edge';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
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
import { EscalationSection } from '@/components/interventions/EscalationSection';
import { CommentsSection } from '@/components/shared/CommentsSection';
import { FeedbackSection } from '@/components/feedback/FeedbackSection';
import { ReportSection } from '@/components/reports/ReportSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  confirmExecutionConfirmation,
  getInterventionById,
  rejectExecutionConfirmation,
  requestExecutionConfirmation,
  confirmAppointment,
  requestAppointmentReschedule,
  respondToRescheduleRequest,
  pauseIntervention,
  resumeIntervention,
  updateFieldTracking,
  updateInterventionStatus,
  createReopenRequest,
  type ExecutionConfirmationDetail,
  type InterventionDetail,
  type KnowledgeBaseSolution,
  type PauseReason,
  type RescheduleRequestStatus,
  type AppointmentRescheduleRequestItem,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSessionUserId, hasSessionRole } from '../../../lib/auth';

function isoToDateStr(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function isoToTimeStr(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return `${String(local.getHours()).padStart(2, '0')}:${String(local.getMinutes()).padStart(2, '0')}`;
}

const EDITABLE_STATUSES = new Set<InterventionStatus>([
  INTERVENTION_STATUS.NEW,
  INTERVENTION_STATUS.IN_PROGRESS,
]);

const STARTABLE_STATUSES = new Set<InterventionStatus>([
  INTERVENTION_STATUS.NEW,
  INTERVENTION_STATUS.ASSIGNED,
]);

const CLOSEABLE_STATUSES = new Set<InterventionStatus>([INTERVENTION_STATUS.IN_PROGRESS]);
const PAUSABLE_STATUSES = new Set<InterventionStatus>([
  INTERVENTION_STATUS.ASSIGNED,
  INTERVENTION_STATUS.IN_PROGRESS,
]);

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
const PENDING_EXECUTION_STATUS = 'PENDING';
const NOT_CONFIRMED_EXECUTION_STATUSES = new Set([
  'NOT_REQUESTED',
  'PENDING',
  'REJECTED',
  'CLOSED_WITHOUT_CONFIRMATION',
]);

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

interface CloseWithoutConfirmationState {
  isOpen: boolean;
  reason: string;
  isLoading: boolean;
}

const INITIAL_CLOSE_WITHOUT_CONFIRMATION_STATE: CloseWithoutConfirmationState = {
  isOpen: false,
  reason: '',
  isLoading: false,
};

const PAUSE_REASON_OPTIONS: Array<{ value: PauseReason; en: string; bs: string }> = [
  { value: 'WAITING_FOR_CUSTOMER', en: 'Waiting for customer', bs: 'Ceka korisnika' },
  { value: 'WAITING_FOR_MATERIAL', en: 'Waiting for material', bs: 'Ceka materijal' },
  { value: 'WAITING_FOR_EXTERNAL_CONTRACTOR', en: 'Waiting for external contractor', bs: 'Ceka vanjskog izvodjaca' },
  { value: 'WAITING_FOR_APPROVAL', en: 'Waiting for approval', bs: 'Ceka odobrenje' },
  { value: 'OTHER', en: 'Other', bs: 'Ostalo' },
];

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
  const [reportTemplate, setReportTemplate] = useState<{
    id: number;
    description: string;
    material: string | null;
    notes: string | null;
  } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingConfirmation, setIsUpdatingConfirmation] = useState(false);
  const [confirmationPin, setConfirmationPin] = useState('');
  const [confirmationPinInput, setConfirmationPinInput] = useState('');
  const [confirmationPinError, setConfirmationPinError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [hasSignature, setHasSignature] = useState(false);
  const [closeWithoutConfirmationState, setCloseWithoutConfirmationState] = useState(
    INITIAL_CLOSE_WITHOUT_CONFIRMATION_STATE,
  );
  const [deleteState, setDeleteState] = useState<DeleteState>(INITIAL_DELETE_STATE);
  const [blockReporterState, setBlockReporterState] = useState<BlockReporterState>(INITIAL_BLOCK_REPORTER_STATE);
  const [isUpdatingFieldTracking, setIsUpdatingFieldTracking] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingSignatureRef = useRef(false);
  const lastSignaturePointRef = useRef<{ x: number; y: number } | null>(null);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState<PauseReason>('WAITING_FOR_CUSTOMER');
  const [pauseOtherReason, setPauseOtherReason] = useState('');
  const [resumeNote, setResumeNote] = useState('');
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenComment, setReopenComment] = useState('');
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [rescheduleProposedDate, setRescheduleProposedDate] = useState('');
  const [rescheduleProposedTime, setRescheduleProposedTime] = useState('');
  const [rescheduleComment, setRescheduleComment] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);
  const [isConfirmingAppointment, setIsConfirmingAppointment] = useState(false);
  const [respondingRequestId, setRespondingRequestId] = useState<number | null>(null);
  const [respondComment, setRespondComment] = useState('');
  const [respondProposedDate, setRespondProposedDate] = useState('');
  const [respondProposedTime, setRespondProposedTime] = useState('');
  const [isResponding, setIsResponding] = useState(false);

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

  const setExecutionConfirmation = (confirmation: ExecutionConfirmationDetail) => {
    setIntervention((current) =>
      current ? { ...current, executionConfirmation: confirmation } : current,
    );
  };

  const handleStatusChange = async (status: InterventionStatus, confirmationBypassReason?: string) => {
    if (!intervention) return;

    setIsUpdatingStatus(true);
    setError(null);
    setSuccessMessage('');

    try {
      const updated = await updateInterventionStatus(intervention.id, status, confirmationBypassReason);
      setIntervention((current) => ({
        ...updated,
        assignments: current?.assignments ?? updated.assignments,
      }));
      setCloseWithoutConfirmationState(INITIAL_CLOSE_WITHOUT_CONFIRMATION_STATE);
      setSuccessMessage(t('interventionDetail.statusUpdated'));
    } catch (err: unknown) {
      setError(err instanceof Error ? translateText(language, err.message) : t('interventionDetail.statusUpdateFailed'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFieldTracking = async (action: 'DISPATCH' | 'ARRIVE' | 'END') => {
    if (!intervention) return;
    setIsUpdatingFieldTracking(true);
    setError(null);
    setSuccessMessage('');
    try {
      const updated = await updateFieldTracking(intervention.id, action);
      setIntervention((current) => ({ ...updated, assignments: current?.assignments ?? updated.assignments }));
      const messages = {
        DISPATCH: language === 'bs' ? 'Evidentirano: krenuli ste prema lokaciji.' : 'Recorded: dispatched to location.',
        ARRIVE: language === 'bs' ? 'Evidentirano: stigli ste na lokaciju.' : 'Recorded: arrived at location.',
        END: language === 'bs' ? 'Evidentirano: završili ste rad na terenu.' : 'Recorded: field work completed.',
      };
      setSuccessMessage(messages[action]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update field tracking.');
    } finally {
      setIsUpdatingFieldTracking(false);
    }
  }
  const handleCloseClick = () => {
    if (!intervention) return;

    if (NOT_CONFIRMED_EXECUTION_STATUSES.has(intervention.executionConfirmation.status)) {
      setCloseWithoutConfirmationState((prev) => ({ ...prev, isOpen: true }));
      return;
    }

    void handleStatusChange(INTERVENTION_STATUS.RESOLVED);
  };

  const handlePause = async () => {
    if (!intervention) return;

    if (pauseReason === 'OTHER' && !pauseOtherReason.trim()) {
      setError(language === 'bs' ? 'Unesite obrazlozenje za razlog Ostalo.' : 'Enter an explanation for Other.');
      return;
    }

    setIsUpdatingStatus(true);
    setError(null);
    setSuccessMessage('');

    try {
      const updated = await pauseIntervention(intervention.id, {
        reason: pauseReason,
        otherReason: pauseReason === 'OTHER' ? pauseOtherReason.trim() : null,
      });
      setIntervention(updated);
      setPauseDialogOpen(false);
      setPauseOtherReason('');
      setSuccessMessage(language === 'bs' ? 'Intervencija je pauzirana.' : 'Intervention paused.');
    } catch (err: unknown) {
      setError(err instanceof Error ? translateText(language, err.message) : 'Failed to pause intervention.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleResume = async () => {
    if (!intervention) return;

    setIsUpdatingStatus(true);
    setError(null);
    setSuccessMessage('');

    try {
      const updated = await resumeIntervention(intervention.id, { note: resumeNote.trim() || null });
      setIntervention(updated);
      setResumeNote('');
      setSuccessMessage(language === 'bs' ? 'Rad je nastavljen.' : 'Work resumed.');
    } catch (err: unknown) {
      setError(err instanceof Error ? translateText(language, err.message) : 'Failed to resume intervention.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReopenRequest = async () => {
    if (!intervention) return;

    if (!reopenReason.trim()) {
      setError(t('reopen.reasonRequired'));
      return;
    }

    const handleConfirmAppointment = async () => {
      if (!intervention) return;

      setIsConfirmingAppointment(true);
      setError(null);
      setSuccessMessage('');

      try {
        const result = await confirmAppointment(intervention.id);
        setIntervention((current) =>
          current ? { ...current, appointmentConfirmedAt: result.appointmentConfirmedAt } : current,
        );
        setSuccessMessage(t('interventionDetail.appointment.appointmentConfirmed'));
      } catch (err: unknown) {
        setError(err instanceof Error ? translateText(language, err.message) : 'Failed to confirm appointment.');
      } finally {
        setIsConfirmingAppointment(false);
      }
    };

    const handleSubmitReschedule = async () => {
      if (!intervention) return;

      setIsSubmittingReschedule(true);
      setError(null);
      setSuccessMessage('');

      try {
        await createReopenRequest(intervention.id, {
          reason: reopenReason.trim(),
          comment: reopenComment.trim() || null,
        });

        setSuccessMessage(t('reopen.requestCreated'));

        setReopenDialogOpen(false);
        setReopenReason('');
        setReopenComment('');
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? translateText(language, err.message)
            : t('reopen.requestFailed'),
        );
      }

      try {
        await requestAppointmentReschedule(intervention.id, {
          proposedStartedAt: new Date(`${rescheduleProposedDate.trim()}T${rescheduleProposedTime.trim()}:00`).toISOString(),
          comment: rescheduleComment.trim(),
        });
        setAppointmentDialogOpen(false);
        setRescheduleProposedDate('');
        setRescheduleProposedTime('');
        setRescheduleComment('');
        const updated = await getInterventionById(interventionId);
        setIntervention(updated);
        setSuccessMessage(t('interventionDetail.appointment.requestSent'));
      } catch (err: unknown) {
        setError(err instanceof Error ? translateText(language, err.message) : 'Failed to submit reschedule request.');
      } finally {
        setIsSubmittingReschedule(false);
      }
    };

    const handleRespondReschedule = async (requestId: number, status: RescheduleRequestStatus, proposedStartedAt?: string) => {
      if (!intervention) return;

      setIsResponding(true);
      setError(null);
      setSuccessMessage('');

      try {
        const payload: {
          status: RescheduleRequestStatus;
          responseComment?: string;
          proposedStartedAt?: string;
        } = {
          status,
          responseComment: respondComment.trim() || undefined,
        };
        if (proposedStartedAt) {
          payload.proposedStartedAt = proposedStartedAt;
        }
        await respondToRescheduleRequest(intervention.id, requestId, payload);
        setRespondingRequestId(null);
        setRespondComment('');
        setRespondProposedDate('');
        setRespondProposedTime('');
        const updated = await getInterventionById(interventionId);
        setIntervention(updated);
        setSuccessMessage(
          status === 'APPROVED'
            ? language === 'bs' ? 'Zahtjev za promjenu termina je odobren.' : 'Reschedule request approved.'
            : language === 'bs' ? 'Zahtjev za promjenu termina je odbijen.' : 'Reschedule request rejected.',
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? translateText(language, err.message) : 'Failed to respond to request.');
      } finally {
        setIsResponding(false);
      }
    };

    const handleRequestExecutionConfirmation = async () => {
      if (!intervention) return;

      setIsUpdatingConfirmation(true);
      setError(null);
      setConfirmationPinError('');
      setSuccessMessage('');

      try {
        const response = await requestExecutionConfirmation(intervention.id);
        setExecutionConfirmation(response.confirmation);
        setConfirmationPin(response.pin ?? '');
        setSuccessMessage(
          response.pinDelivery === 'NOTIFICATION'
            ? t('interventionDetail.confirmationRequestedUserNotified')
            : t('interventionDetail.confirmationRequested'),
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? translateText(language, err.message) : t('interventionDetail.confirmationRequestFailed'));
      } finally {
        setIsUpdatingConfirmation(false);
      }
    };

    const handleConfirmPin = async () => {
      if (!intervention || !confirmationPinInput.trim()) return;

      setIsUpdatingConfirmation(true);
      setError(null);
      setSuccessMessage('');

      try {
        const confirmation = await confirmExecutionConfirmation(intervention.id, {
          method: 'PIN',
          pin: confirmationPinInput.trim(),
        });
        setExecutionConfirmation(confirmation);
        setConfirmationPin('');
        setConfirmationPinInput('');
        setConfirmationPinError('');
        setSuccessMessage(t('interventionDetail.confirmationConfirmed'));
      } catch (err: unknown) {
        const message = err instanceof Error
          ? translateText(language, err.message)
          : t('interventionDetail.confirmationConfirmFailed');
        setConfirmationPinError(message);
        setError(message);
      } finally {
        setIsUpdatingConfirmation(false);
      }
    };

    const handleConfirmSignature = async () => {
      if (!intervention || !signatureCanvasRef.current) return;

      setIsUpdatingConfirmation(true);
      setError(null);
      setSuccessMessage('');

      try {
        const confirmation = await confirmExecutionConfirmation(intervention.id, {
          method: 'SIGNATURE',
          signatureData: signatureCanvasRef.current.toDataURL('image/png'),
        });
        setExecutionConfirmation(confirmation);
        setConfirmationPin('');
        clearSignature();
        setSuccessMessage(t('interventionDetail.confirmationConfirmed'));
      } catch (err: unknown) {
        setError(err instanceof Error ? translateText(language, err.message) : t('interventionDetail.confirmationConfirmFailed'));
      } finally {
        setIsUpdatingConfirmation(false);
      }
    };

    const handleRejectConfirmation = async () => {
      if (!intervention || !rejectionReason.trim()) return;

      setIsUpdatingConfirmation(true);
      setError(null);
      setSuccessMessage('');

      try {
        const confirmation = await rejectExecutionConfirmation(intervention.id, {
          reason: rejectionReason.trim(),
        });
        setExecutionConfirmation(confirmation);
        setConfirmationPin('');
        setRejectionReason('');
        setSuccessMessage(t('interventionDetail.confirmationRejected'));
      } catch (err: unknown) {
        setError(err instanceof Error ? translateText(language, err.message) : t('interventionDetail.confirmationRejectFailed'));
      } finally {
        setIsUpdatingConfirmation(false);
      }
    };

    const getSignaturePoint = (event: PointerEvent<HTMLCanvasElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const startSignature = (event: PointerEvent<HTMLCanvasElement>) => {
      isDrawingSignatureRef.current = true;
      lastSignaturePointRef.current = getSignaturePoint(event);
      event.currentTarget.setPointerCapture(event.pointerId);
    };

    const drawSignature = (event: PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingSignatureRef.current || !signatureCanvasRef.current) return;

      const context = signatureCanvasRef.current.getContext('2d');
      const lastPoint = lastSignaturePointRef.current;
      const nextPoint = getSignaturePoint(event);

      if (!context || !lastPoint) return;

      context.strokeStyle = '#111827';
      context.lineWidth = 2;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(lastPoint.x, lastPoint.y);
      context.lineTo(nextPoint.x, nextPoint.y);
      context.stroke();
      lastSignaturePointRef.current = nextPoint;
      setHasSignature(true);
    };

    const endSignature = () => {
      isDrawingSignatureRef.current = false;
      lastSignaturePointRef.current = null;
    };

    const clearSignature = () => {
      const canvas = signatureCanvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
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
    const isAssignedServicer = Boolean(
      sessionUserId &&
      intervention?.assignments?.some((assignment) => assignment.userId === sessionUserId),
    );
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
    const executionConfirmation = intervention?.executionConfirmation;
    const confirmationStatus = executionConfirmation?.status ?? 'NOT_REQUESTED';
    const confirmationIsPending = confirmationStatus === PENDING_EXECUTION_STATUS;
    const canRequestConfirmation = Boolean(
      intervention &&
      canChangeStatus &&
      intervention.status === INTERVENTION_STATUS.IN_PROGRESS &&
      confirmationStatus !== 'CONFIRMED',
    );
    const canRespondToConfirmation = Boolean(
      confirmationIsPending &&
      (canSubmitFeedback || isAssignedServicer || canChangeStatus || canManageIntervention),
    );
    const confirmationStatusLabel = t(`interventionDetail.confirmationStatus.${confirmationStatus}`);
    const confirmationMethodLabel = executionConfirmation?.method
      ? t(`interventionDetail.confirmationMethod.${executionConfirmation.method}`)
      : '-';

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
                handleCloseClick();
              },
              variant: 'outline' as const,
              isLoading: isUpdatingStatus,
            },
          ]
          : []),
        ...(canChangeStatus && PAUSABLE_STATUSES.has(intervention.status)
          ? [
            {
              label: language === 'bs' ? 'Pauziraj' : 'Pause',
              onClick: () => setPauseDialogOpen(true),
              variant: 'outline' as const,
              isLoading: isUpdatingStatus,
            },
          ]
          : []),
        ...(canChangeStatus && intervention.status === INTERVENTION_STATUS.ON_HOLD
          ? [
            {
              label: language === 'bs' ? 'Nastavi rad' : 'Resume',
              onClick: () => {
                void handleResume();
              },
              variant: 'outline' as const,
              isLoading: isUpdatingStatus,
            },
          ]
          : []),
        ...(intervention.status === INTERVENTION_STATUS.RESOLVED && canSubmitFeedback
          ? [
            {
              label: t('reopen.request'),
              onClick: () => setReopenDialogOpen(true),
              variant: 'outline' as const,
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
        {intervention && executionConfirmation ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('interventionDetail.confirmationTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t('interventionDetail.confirmationStatus')}</p>
                  <p className="font-medium">{confirmationStatusLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('interventionDetail.confirmationMethod')}</p>
                  <p className="font-medium">{confirmationMethodLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('interventionDetail.confirmationRequestedAt')}</p>
                  <p className="font-medium">
                    {executionConfirmation.requestedAt
                      ? new Date(executionConfirmation.requestedAt).toLocaleString(language === 'bs' ? 'bs-BA' : 'en-GB', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('interventionDetail.confirmationRespondedAt')}</p>
                  <p className="font-medium">
                    {executionConfirmation.respondedAt
                      ? new Date(executionConfirmation.respondedAt).toLocaleString(language === 'bs' ? 'bs-BA' : 'en-GB', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                      : '-'}
                  </p>
                </div>
              </div>

              {executionConfirmation.requestedBy ? (
                <p className="text-sm text-muted-foreground">
                  {t('interventionDetail.confirmationRequestedBy')}: {executionConfirmation.requestedBy}
                </p>
              ) : null}
              {executionConfirmation.confirmedBy ? (
                <p className="text-sm text-muted-foreground">
                  {t('interventionDetail.confirmationConfirmedBy')}: {executionConfirmation.confirmedBy}
                </p>
              ) : null}
              {executionConfirmation.rejectionReason ? (
                <p className="text-sm text-destructive">
                  {t('interventionDetail.confirmationRejectionReason')}: {executionConfirmation.rejectionReason}
                </p>
              ) : null}
              {executionConfirmation.bypassReason ? (
                <p className="text-sm text-muted-foreground">
                  {t('interventionDetail.confirmationBypassReason')}: {executionConfirmation.bypassReason}
                </p>
              ) : null}

              {confirmationPin ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  {t('interventionDetail.confirmationPin')}: <span className="font-mono text-lg font-semibold">{confirmationPin}</span>
                </div>
              ) : null}

              {canRequestConfirmation ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void handleRequestExecutionConfirmation();
                  }}
                  disabled={isUpdatingConfirmation}
                >
                  {isUpdatingConfirmation ? t('interventionDetail.confirmationRequesting') : t('interventionDetail.confirmationRequest')}
                </Button>
              ) : null}

              {canRespondToConfirmation ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="execution-confirmation-pin">{t('interventionDetail.confirmationEnterPin')}</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="execution-confirmation-pin"
                        inputMode="numeric"
                        maxLength={6}
                        value={confirmationPinInput}
                        aria-invalid={Boolean(confirmationPinError)}
                        aria-describedby={confirmationPinError ? 'execution-confirmation-pin-error' : undefined}
                        onChange={(event) => {
                          setConfirmationPinInput(event.target.value.replace(/\D/g, '').slice(0, 6));
                          setConfirmationPinError('');
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          void handleConfirmPin();
                        }}
                        disabled={isUpdatingConfirmation || confirmationPinInput.length !== 6}
                      >
                        {t('interventionDetail.confirmationConfirmPin')}
                      </Button>
                    </div>
                    {confirmationPinError ? (
                      <p id="execution-confirmation-pin-error" className="text-sm text-destructive">
                        {confirmationPinError}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <Label>{t('interventionDetail.confirmationSignature')}</Label>
                    <canvas
                      ref={signatureCanvasRef}
                      width={520}
                      height={160}
                      className="h-40 w-full touch-none rounded-md border bg-white"
                      onPointerDown={startSignature}
                      onPointerMove={drawSignature}
                      onPointerUp={endSignature}
                      onPointerCancel={endSignature}
                      onPointerLeave={endSignature}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearSignature}
                        disabled={isUpdatingConfirmation}
                      >
                        {t('interventionDetail.confirmationClearSignature')}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          void handleConfirmSignature();
                        }}
                        disabled={isUpdatingConfirmation || !hasSignature}
                      >
                        {t('interventionDetail.confirmationConfirmSignature')}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 lg:col-span-2">
                    <Label htmlFor="execution-confirmation-rejection">{t('interventionDetail.confirmationRejectReason')}</Label>
                    <Textarea
                      id="execution-confirmation-rejection"
                      rows={3}
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        void handleRejectConfirmation();
                      }}
                      disabled={isUpdatingConfirmation || rejectionReason.trim().length < 3}
                    >
                      {t('interventionDetail.confirmationReject')}
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {/* ── Appointment section ── */}
        {intervention ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('interventionDetail.appointment.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t('interventionDetail.appointment.scheduled')}</p>
                  <p className="font-medium">
                    {intervention.startedAt
                      ? new Date(intervention.startedAt).toLocaleString(language === 'bs' ? 'bs-BA' : 'en-GB', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('interventionDetail.confirmationStatus')}</p>
                  <p className="font-medium">
                    {intervention.appointmentConfirmedAt
                      ? t('interventionDetail.appointment.confirmed')
                      : t('interventionDetail.appointment.notConfirmed')}
                  </p>
                </div>
              </div>

              {canSubmitFeedback && intervention.startedAt && !intervention.appointmentConfirmedAt ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => { void handleConfirmAppointment(); }}
                    disabled={isConfirmingAppointment}
                  >
                    {isConfirmingAppointment
                      ? (language === 'bs' ? 'Potvrđivanje...' : 'Confirming...')
                      : t('interventionDetail.appointment.confirm')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRescheduleProposedDate(isoToDateStr(intervention.startedAt));
                      setRescheduleProposedTime(isoToTimeStr(intervention.startedAt));
                      setRescheduleComment('');
                      setAppointmentDialogOpen(true);
                    }}
                  >
                    {t('interventionDetail.appointment.reschedule')}
                  </Button>
                </div>
              ) : null}

              {isCoordinator && intervention.rescheduleRequests && intervention.rescheduleRequests.length > 0 ? (
                <div>
                  <p className="text-sm font-medium mb-2">{t('interventionDetail.appointment.rescheduleHistory')}</p>
                  <div className="space-y-2">
                    {intervention.rescheduleRequests.map((req) => (
                      <div key={req.id} className="rounded-md border p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">
                            {new Date(req.proposedStartedAt).toLocaleString(language === 'bs' ? 'bs-BA' : 'en-GB', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                            {t(`interventionDetail.appointment.requestStatus.${req.status}`)}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1">{req.comment}</p>
                        {req.requestedBy ? (
                          <p className="text-xs text-muted-foreground mt-1">
                            {language === 'bs' ? 'Zahtjev od' : 'Requested by'}: {req.requestedBy}
                          </p>
                        ) : null}
                        {req.responseComment ? (
                          <p className="text-xs text-muted-foreground mt-1">
                            {language === 'bs' ? 'Odgovor' : 'Response'}: {req.responseComment}
                          </p>
                        ) : null}
                        {req.respondedBy ? (
                          <p className="text-xs text-muted-foreground">
                            {language === 'bs' ? 'Odgovorio' : 'Responded by'}: {req.respondedBy}
                          </p>
                        ) : null}

                        {req.status === 'PENDING' && isCoordinator ? (
                          <div className="mt-3 space-y-2">
                            <div className="space-y-1">
                              <Label htmlFor={`respond-proposed-${req.id}`}>
                                {language === 'bs' ? 'Predloži alternativni termin (za dugme "Predloži novi")' : 'Propose alternative time (for "Propose alternative" button)'}
                              </Label>
                              <div className="flex gap-2">
                                <input
                                  id={`respond-proposed-${req.id}`}
                                  type="date"
                                  className="h-8 flex-1 min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                                  value={respondingRequestId === req.id ? respondProposedDate : ''}
                                  onChange={(e) => {
                                    setRespondingRequestId(req.id);
                                    setRespondProposedDate(e.target.value);
                                  }}
                                />
                                <input
                                  id={`respond-proposed-time-${req.id}`}
                                  type="time"
                                  step="300"
                                  className="h-8 w-36 min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                                  value={respondingRequestId === req.id ? respondProposedTime : ''}
                                  onChange={(e) => {
                                    setRespondingRequestId(req.id);
                                    setRespondProposedTime(e.target.value);
                                  }}
                                />
                              </div>
                            </div>
                            <Textarea
                              rows={2}
                              placeholder={language === 'bs' ? 'Komentar (opcionalno)' : 'Comment (optional)'}
                              value={respondingRequestId === req.id ? respondComment : ''}
                              onChange={(e) => {
                                setRespondingRequestId(req.id);
                                setRespondComment(e.target.value);
                              }}
                            />
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                type="button"
                                size="sm"
                                variant="default"
                                disabled={isResponding && respondingRequestId === req.id}
                                onClick={() => { void handleRespondReschedule(req.id, 'APPROVED'); }}
                              >
                                {language === 'bs' ? 'Prihvati predloženi' : 'Accept proposed'}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={(isResponding && respondingRequestId === req.id) || !respondProposedDate.trim() || !respondProposedTime.trim()}
                                onClick={() => {
                                  void handleRespondReschedule(
                                    req.id,
                                    'APPROVED',
                                    new Date(`${respondProposedDate.trim()}T${respondProposedTime.trim()}:00`).toISOString(),
                                  );
                                }}
                              >
                                {language === 'bs' ? 'Predloži novi' : 'Propose alternative'}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                disabled={isResponding && respondingRequestId === req.id}
                                onClick={() => { void handleRespondReschedule(req.id, 'REJECTED'); }}
                              >
                                {language === 'bs' ? 'Odbij' : 'Reject'}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {/* ── Reschedule dialog ── */}
        <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('interventionDetail.appointment.rescheduleTitle')}</DialogTitle>
              <DialogDescription>
                {language === 'bs'
                  ? 'Predložite novi datum i vrijeme te navedite razlog promjene.'
                  : 'Propose a new date and time and provide a reason for the change.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('interventionDetail.appointment.proposedTime')}</Label>
                <div className="flex gap-2">
                  <input
                    id="reschedule-proposed-date"
                    type="date"
                    className="h-8 flex-1 min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                    value={rescheduleProposedDate}
                    onChange={(e) => setRescheduleProposedDate(e.target.value)}
                  />
                  <input
                    id="reschedule-proposed-time"
                    type="time"
                    step="300"
                    className="h-8 w-36 min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                    value={rescheduleProposedTime}
                    onChange={(e) => setRescheduleProposedTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reschedule-comment">{t('interventionDetail.appointment.comment')}</Label>
                <Textarea
                  id="reschedule-comment"
                  rows={3}
                  value={rescheduleComment}
                  onChange={(e) => setRescheduleComment(e.target.value)}
                  placeholder={language === 'bs' ? 'Unesite razlog promjene termina...' : 'Enter reason for the change...'}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAppointmentDialogOpen(false)}
              >
                {language === 'bs' ? 'Odustani' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={() => { void handleSubmitReschedule(); }}
                disabled={isSubmittingReschedule || !rescheduleProposedDate || !rescheduleProposedTime || rescheduleComment.trim().length < 3}
              >
                {isSubmittingReschedule
                  ? t('interventionDetail.appointment.submitting')
                  : t('interventionDetail.appointment.submit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        {/* ── PBI-060: Field time tracking ── */}
        {intervention && (canWriteReport || canChangeStatus) ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'bs' ? 'Evidencija dolaska i rada na terenu' : 'Field Time Tracking'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bs' ? 'Krenuo prema lokaciji' : 'Dispatched'}
                  </p>
                  <p className="font-medium text-sm">
                    {intervention.dispatchedAt
                      ? new Date(intervention.dispatchedAt).toLocaleString(language === 'bs' ? 'bs-BA' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bs' ? 'Stigao na lokaciju' : 'Arrived'}
                  </p>
                  <p className="font-medium text-sm">
                    {intervention.arrivedAt
                      ? new Date(intervention.arrivedAt).toLocaleString(language === 'bs' ? 'bs-BA' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bs' ? 'Završio rad na terenu' : 'Field work ended'}
                  </p>
                  <p className="font-medium text-sm">
                    {intervention.fieldWorkEndedAt
                      ? new Date(intervention.fieldWorkEndedAt).toLocaleString(language === 'bs' ? 'bs-BA' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })
                      : '—'}
                  </p>
                </div>
              </div>

              {canWriteReport && (
                <div className="flex flex-wrap gap-2">
                  {!intervention.dispatchedAt && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUpdatingFieldTracking}
                      onClick={() => void handleFieldTracking('DISPATCH')}
                    >
                      {language === 'bs' ? 'Krećem prema lokaciji' : 'Dispatched to location'}
                    </Button>
                  )}
                  {intervention.dispatchedAt && !intervention.arrivedAt && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUpdatingFieldTracking}
                      onClick={() => void handleFieldTracking('ARRIVE')}
                    >
                      {language === 'bs' ? 'Stigao sam na lokaciju' : 'Arrived at location'}
                    </Button>
                  )}
                  {intervention.arrivedAt && !intervention.fieldWorkEndedAt && CLOSEABLE_STATUSES.has(intervention.status) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={handleCloseClick}
                    >
                      {language === 'bs' ? 'Zavrsi i zatvori intervenciju' : 'Finish and close intervention'}
                    </Button>
                  )}
                </div>
              )}
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

        {intervention?.pauses && intervention.pauses.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'bs' ? 'Pauze intervencije' : 'Intervention pauses'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {intervention.pauses.map((pause) => {
                const option = PAUSE_REASON_OPTIONS.find((item) => item.value === pause.reason);
                return (
                  <div key={pause.id} className="rounded-lg border px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          {language === 'bs' ? 'Razlog pauze' : 'Pause reason'}
                        </p>
                        <p className="font-medium">
                          {option ? (language === 'bs' ? option.bs : option.en) : pause.reason}
                        </p>
                      </div>
                      <InterventionStatusBadge status={pause.resumedAt ? pause.previousStatus : INTERVENTION_STATUS.ON_HOLD} />
                    </div>
                    {pause.otherReason ? (
                      <p className="mt-2 whitespace-pre-wrap rounded-md bg-muted/50 px-3 py-2 text-muted-foreground">
                        {pause.otherReason}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {language === 'bs' ? 'Pauzirao' : 'Paused by'} {pause.pausedBy.firstName} {pause.pausedBy.lastName} - {new Date(pause.pausedAt).toLocaleString(language === 'bs' ? 'bs-BA' : 'en-GB')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'bs' ? 'Odgovoran za nastavak' : 'Responsible for resume'}: {pause.responsibleUser ? `${pause.responsibleUser.firstName} ${pause.responsibleUser.lastName}` : '-'}
                    </p>
                    {pause.resumedAt ? (
                      <p className="text-xs text-muted-foreground">
                        {language === 'bs' ? 'Nastavljeno' : 'Resumed'} {new Date(pause.resumedAt).toLocaleString(language === 'bs' ? 'bs-BA' : 'en-GB')}
                        {pause.resumeNote ? ` - ${pause.resumeNote}` : ''}
                      </p>
                    ) : null}
                  </div>
                );
              })}
              {intervention.status === INTERVENTION_STATUS.ON_HOLD ? (
                <div className="space-y-2">
                  <Label htmlFor="resume-note">{language === 'bs' ? 'Napomena za nastavak' : 'Resume note'}</Label>
                  <Textarea
                    id="resume-note"
                    rows={2}
                    value={resumeNote}
                    placeholder={language === 'bs' ? 'Opcionalna napomena za nastavak rada...' : 'Optional note for resuming work...'}
                    onChange={(event) => setResumeNote(event.target.value)}
                  />
                  {canChangeStatus ? (
                    <Button type="button" onClick={() => void handleResume()} disabled={isUpdatingStatus}>
                      {isUpdatingStatus
                        ? (language === 'bs' ? 'Nastavljanje...' : 'Resuming...')
                        : (language === 'bs' ? 'Nastavi rad' : 'Resume work')}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {/* PBI-055: Knowledge base and recommended solutions */}
        {intervention && (canReadReport || canWriteReport) ? (
          <KnowledgeBaseSection
            interventionId={interventionId}
            canUseAsTemplate={canWriteReport}
            onUseSolution={(solution: KnowledgeBaseSolution) => {
              setReportTemplate({
                id: solution.reportId,
                description: solution.solution,
                material: solution.material,
                notes: solution.notes,
              });
            }}
          />
        ) : null}

        {/* ── PBI-010: Intervention report ── */}
        {intervention && (canReadReport || canWriteReport) ? (
          <ReportSection
            interventionId={interventionId}
            interventionStatus={intervention.status}
            canRead={canReadReport}
            canWrite={canWriteReport}
            canRecommend={canManageIntervention}
            reportTemplate={reportTemplate}
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
        {isValidId ? <EscalationSection interventionId={interventionId} /> : null}
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
        <Dialog
          open={closeWithoutConfirmationState.isOpen}
          onOpenChange={(open) =>
            !open && setCloseWithoutConfirmationState(INITIAL_CLOSE_WITHOUT_CONFIRMATION_STATE)
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('interventionDetail.closeWithoutConfirmationTitle')}</DialogTitle>
              <DialogDescription>
                {t('interventionDetail.closeWithoutConfirmationDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="close-without-confirmation-reason">
                {t('interventionDetail.closeWithoutConfirmationReason')}
              </Label>
              <Textarea
                id="close-without-confirmation-reason"
                rows={4}
                value={closeWithoutConfirmationState.reason}
                onChange={(event) =>
                  setCloseWithoutConfirmationState((prev) => ({
                    ...prev,
                    reason: event.target.value,
                  }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCloseWithoutConfirmationState(INITIAL_CLOSE_WITHOUT_CONFIRMATION_STATE)}
                disabled={isUpdatingStatus}
              >
                {t('tickets.cancel')}
              </Button>
              <Button
                onClick={() => {
                  setCloseWithoutConfirmationState((prev) => ({ ...prev, isLoading: true }));
                  void handleStatusChange(
                    INTERVENTION_STATUS.RESOLVED,
                    closeWithoutConfirmationState.reason.trim(),
                  );
                }}
                disabled={isUpdatingStatus || closeWithoutConfirmationState.reason.trim().length < 3}
              >
                {isUpdatingStatus || closeWithoutConfirmationState.isLoading
                  ? t('interventionDetail.closing')
                  : t('interventionDetail.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === 'bs' ? 'Pauziraj intervenciju' : 'Pause intervention'}</DialogTitle>
              <DialogDescription>
                {language === 'bs' ? 'Odaberite razlog blokera prije stavljanja intervencije na cekanje.' : 'Select the blocker reason before putting the intervention on hold.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="pause-reason">{language === 'bs' ? 'Razlog' : 'Reason'}</Label>
                <Select value={pauseReason} onValueChange={(value) => setPauseReason(value as PauseReason)}>
                  <SelectTrigger id="pause-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAUSE_REASON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {language === 'bs' ? option.bs : option.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {pauseReason === 'OTHER' ? (
                <div className="space-y-2">
                  <Label htmlFor="pause-other">{language === 'bs' ? 'Obrazlozenje' : 'Explanation'}</Label>
                  <Textarea
                    id="pause-other"
                    rows={3}
                    value={pauseOtherReason}
                    onChange={(event) => setPauseOtherReason(event.target.value)}
                  />
                </div>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPauseDialogOpen(false)} disabled={isUpdatingStatus}>
                {language === 'bs' ? 'Odustani' : 'Cancel'}
              </Button>
              <Button onClick={() => void handlePause()} disabled={isUpdatingStatus}>
                {isUpdatingStatus ? (language === 'bs' ? 'Pauziranje...' : 'Pausing...') : (language === 'bs' ? 'Pauziraj' : 'Pause')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('reopen.request')}</DialogTitle>
              <DialogDescription>
                {t('reopen.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reopen-reason">
                  {t('reopen.reason')}
                </Label>

                <Textarea
                  id="reopen-reason"
                  rows={4}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reopen-comment">
                  {t('reopen.comment')}
                </Label>

                <Textarea
                  id="reopen-comment"
                  rows={3}
                  value={reopenComment}
                  onChange={(e) => setReopenComment(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReopenDialogOpen(false)}
              >
                {t('tickets.cancel')}
              </Button>

              <Button
                onClick={() => {
                  void handleReopenRequest();
                }}
              >
                {t('reopen.submit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageLayout>
    );
  }
}