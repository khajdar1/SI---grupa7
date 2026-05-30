'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ClipboardList, Pencil, Plus, Star } from 'lucide-react';

import { INTERVENTION_STATUS, type InterventionStatus } from '@shared/enums';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  createInterventionReport,
  finalizeInterventionReport,
  getInterventionReport,
  setInterventionReportRecommendation,
  updateInterventionReport,
  type CreateReportPayload,
  type InterventionReport,
  type UpdateReportPayload,
} from '@/services/reports.service';
import { translateText, useI18n } from '@/lib/i18n';

const REPORT_ALLOWED_STATUSES = new Set<InterventionStatus>([
  INTERVENTION_STATUS.IN_PROGRESS,
  INTERVENTION_STATUS.RESOLVED,
]);

const FIELD_MAX_LENGTH = {
  DESCRIPTION: 5000,
  MATERIAL: 2000,
  NOTES: 2000,
} as const;

export interface ReportSectionProps {
  interventionId: number;
  interventionStatus: InterventionStatus;
  canRead: boolean;
  canWrite: boolean;
  canRecommend?: boolean;
}

interface FormState {
  description: string;
  material: string;
  notes: string;
}

const EMPTY_FORM: FormState = { description: '', material: '', notes: '' };

function reportToForm(report: InterventionReport): FormState {
  return {
    description: report.description,
    material: report.material ?? '',
    notes: report.notes ?? '',
  };
}

export function ReportSection({
  interventionId,
  interventionStatus,
  canRead,
  canWrite,
  canRecommend = false,
}: ReportSectionProps) {
  const { language, t } = useI18n();
  const [report, setReport] = useState<InterventionReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isUpdatingRecommendation, setIsUpdatingRecommendation] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const isAllowedStatus = REPORT_ALLOWED_STATUSES.has(interventionStatus);
  const canSeeSection = canRead || canWrite;

  useEffect(() => {
    if (!canSeeSection) return;

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getInterventionReport(interventionId);
        if (!cancelled) {
          setReport(data);
          if (data) setForm(reportToForm(data));
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? translateText(language, err.message) : t('report.loadFailed'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [interventionId, canSeeSection]);

  useEffect(() => {
    if (isEditing) descriptionRef.current?.focus();
  }, [isEditing]);

  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleEdit = () => {
    setForm(report ? reportToForm(report) : EMPTY_FORM);
    setError(null);
    setSuccessMessage('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.description.trim()) {
      setError(t('report.descriptionRequired'));
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      if (report) {
        const payload: UpdateReportPayload = {
          description: form.description.trim(),
          material: form.material.trim() || null,
          notes: form.notes.trim() || null,
        };
        const updated = await updateInterventionReport(interventionId, payload);
        setReport(updated);
        setForm(reportToForm(updated));
      } else {
        const payload: CreateReportPayload = {
          description: form.description.trim(),
          material: form.material.trim() || null,
          notes: form.notes.trim() || null,
        };
        const created = await createInterventionReport(interventionId, payload);
        setReport(created);
        setForm(reportToForm(created));
      }

      setIsEditing(false);
      setSuccessMessage(t('report.saved'));
    } catch (err: unknown) {
      setError(err instanceof Error ? translateText(language, err.message) : t('report.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);
    setError(null);
    setSuccessMessage('');

    try {
      const finalized = await finalizeInterventionReport(interventionId);
      setReport(finalized);
      setSuccessMessage(t('report.finalized'));
    } catch (err: unknown) {
      setError(err instanceof Error ? translateText(language, err.message) : t('report.finalizeFailed'));
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleRecommendation = async () => {
    if (!report) return;

    setIsUpdatingRecommendation(true);
    setError(null);
    setSuccessMessage('');

    try {
      const updated = await setInterventionReportRecommendation(
        interventionId,
        !report.isRecommended,
      );
      setReport(updated);
      setSuccessMessage(
        updated.isRecommended ? t('report.recommended') : t('report.unrecommended'),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? translateText(language, err.message) : t('report.recommendationFailed'));
    } finally {
      setIsUpdatingRecommendation(false);
    }
  };

  if (!canSeeSection) return null;

  return (
    <Card className="stat-card-glow">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="size-4 text-primary" />
          </div>
          <CardTitle className="text-base">{t('report.sectionTitle')}</CardTitle>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {report && canWrite && report.status === 'DRAFT' && !isEditing ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { void handleFinalize(); }}
              disabled={isFinalizing}
              className="gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              {isFinalizing ? t('report.finalizing') : t('report.finalize')}
            </Button>
          ) : null}
          {report && canRecommend && report.status === 'FINALIZED' && !isEditing ? (
            <Button
              type="button"
              variant={report.isRecommended ? 'default' : 'outline'}
              size="sm"
              onClick={() => { void handleRecommendation(); }}
              disabled={isUpdatingRecommendation}
              className="gap-1.5"
            >
              <Star className="size-3.5" />
              {report.isRecommended ? t('report.unrecommend') : t('report.recommend')}
            </Button>
          ) : null}
          {canWrite && isAllowedStatus && !isEditing && report?.status !== 'FINALIZED' ? (
            <Button type="button" variant="outline" size="sm" onClick={handleEdit} className="gap-1.5">
              {report
                ? <><Pencil className="size-3.5" /> {t('report.edit')}</>
                : <><Plus className="size-3.5" /> {t('report.add')}</>}
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {successMessage ? (
          <p className="rounded-lg border border-emerald-300/40 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : isEditing ? (
          <ReportForm
            form={form}
            isSaving={isSaving}
            descriptionRef={descriptionRef}
            onChange={handleChange}
            onSave={() => { void handleSave(); }}
            onCancel={handleCancel}
          />
        ) : report ? (
          <ReportReadView report={report} language={language} />
        ) : (
          <ReportEmptyState canWrite={canWrite} isAllowedStatus={isAllowedStatus} />
        )}
      </CardContent>
    </Card>
  );
}

interface ReportFormProps {
  form: FormState;
  isSaving: boolean;
  descriptionRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (field: keyof FormState) => (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSave: () => void;
  onCancel: () => void;
}

function ReportForm({ form, isSaving, descriptionRef, onChange, onSave, onCancel }: ReportFormProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="report-description">
          {t('report.workDescription')} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="report-description"
          ref={descriptionRef as React.Ref<HTMLTextAreaElement>}
          value={form.description}
          onChange={onChange('description')}
          placeholder={t('report.describePlaceholder')}
          maxLength={FIELD_MAX_LENGTH.DESCRIPTION}
          rows={5}
          disabled={isSaving}
        />
        <p className="text-right text-xs text-muted-foreground">
          {form.description.length} / {FIELD_MAX_LENGTH.DESCRIPTION}
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="report-material">{t('report.materials')}</Label>
        <Textarea
          id="report-material"
          value={form.material}
          onChange={onChange('material')}
          placeholder={t('report.materialsPlaceholder')}
          maxLength={FIELD_MAX_LENGTH.MATERIAL}
          rows={3}
          disabled={isSaving}
        />
        <p className="text-right text-xs text-muted-foreground">
          {form.material.length} / {FIELD_MAX_LENGTH.MATERIAL}
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="report-notes">{t('report.notes')}</Label>
        <Textarea
          id="report-notes"
          value={form.notes}
          onChange={onChange('notes')}
          placeholder={t('report.notesPlaceholder')}
          maxLength={FIELD_MAX_LENGTH.NOTES}
          rows={3}
          disabled={isSaving}
        />
        <p className="text-right text-xs text-muted-foreground">
          {form.notes.length} / {FIELD_MAX_LENGTH.NOTES}
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
          {t('tickets.cancel')}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="btn-glow rounded-lg"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="spinner" />
              {t('common.saving')}
            </span>
          ) : t('report.save')}
        </Button>
      </div>
    </div>
  );
}

interface ReportReadViewProps {
  report: InterventionReport;
  language: string;
}

function ReportReadView({ report, language }: ReportReadViewProps) {
  const { t } = useI18n();
  const formattedDate = new Date(report.reportDate).toLocaleDateString(language === 'bs' ? 'bs-BA' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {t('report.author')}{' '}
        <span className="font-medium text-foreground">
          {report.author.firstName} {report.author.lastName}
        </span>{' '}
        · {t('report.savedLabel')} <span className="font-medium text-foreground">{formattedDate}</span>
      </p>

      {report.isRecommended ? (
        <p className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
          <Star className="size-3" />
          {t('report.recommendedBadge')}
        </p>
      ) : null}

      <div className="rounded-lg bg-muted/40 p-3">
        <p className="mb-1 text-xs font-medium text-muted-foreground">{t('report.workDescription')}</p>
        <p className="whitespace-pre-wrap text-sm">{report.description}</p>
      </div>

      {report.material ? (
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">{t('report.materials')}</p>
          <p className="whitespace-pre-wrap text-sm">{report.material}</p>
        </div>
      ) : null}

      {report.notes ? (
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">{t('report.notes')}</p>
          <p className="whitespace-pre-wrap text-sm">{report.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

interface ReportEmptyStateProps {
  canWrite: boolean;
  isAllowedStatus: boolean;
}

function ReportEmptyState({ canWrite, isAllowedStatus }: ReportEmptyStateProps) {
  const { t } = useI18n();

  if (canWrite && !isAllowedStatus) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('report.notAllowedYet')}
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      {canWrite
        ? t('report.emptyWriter')
        : t('report.emptyReader')}
    </p>
  );
}
