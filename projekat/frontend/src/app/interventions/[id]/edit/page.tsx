'use client';

export const runtime = 'edge';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { ROUTES, VALIDATION } from '@/constants';
import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { Category } from '@/models/Category';
import type { Company } from '@/models/Company';
import {
  clearFieldError,
  getApiFieldErrors,
  validateCalendarDate,
  validateRequired,
  validateSafeText,
  type FieldErrors,
} from '@/lib/form-validation';
import {
  translateCategoryName,
  translateLocationValue,
  translatePriority,
  translateText,
  useI18n,
  type TranslationKey,
} from '@/lib/i18n';
import { getCategories } from '@/services/categories.service';
import { getCompanies } from '@/services/companies.service';
import type { Priority } from '@shared/enums';
import {
  getInterventionById,
  updateIntervention,
  updateRecurrence,
  type InterventionDetail,
} from '@/services/interventions.service';

const EDITABLE_STATUSES = new Set(['NEW', 'IN_PROGRESS']);

const PRIORITY_OPTIONS = [
  { value: 'LOW' },
  { value: 'MEDIUM' },
  { value: 'HIGH' },
  { value: 'CRITICAL' },
] as const;

const TYPE_OPTIONS = [
  { value: 'ISSUE', labelKey: 'interventionForm.issueReactive' },
  { value: 'PREVENTIVE', labelKey: 'interventionForm.preventiveMaintenance' },
] as const;

const RECURRING_PERIOD_OPTIONS = [
  { value: '', labelKey: 'interventionForm.noRecurrence' },
  { value: 'DAILY', labelKey: 'interventionForm.daily' },
  { value: 'WEEKLY', labelKey: 'interventionForm.weekly' },
  { value: 'MONTHLY', labelKey: 'interventionForm.monthly' },
] as const;

interface FormState {
  name: string;
  description: string;
  location: string;
  categoryId: string;
  companyId: string;
  priority: string;
  type: string;
  startedAt: string;
  dueAt: string;
  faultReportId: string;
  recurringPeriod: string;
}

function isoDateToInput(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function getTypeLabel(type: string, t: (key: TranslationKey) => string): string {
  return t(TYPE_OPTIONS.find((option) => option.value === type)?.labelKey ?? 'interventionForm.issueReactive');
}

function getRecurringPeriodLabel(value: string, t: (key: TranslationKey) => string): string {
  return t(
    RECURRING_PERIOD_OPTIONS.find((option) => option.value === value)?.labelKey ?? 'interventionForm.noRecurrence',
  );
}

export default function EditInterventionPage() {
  const params = useParams();
  const router = useRouter();
  const { language, t } = useI18n();
  const interventionId = Number(params.id);

  const [intervention, setIntervention] = useState<InterventionDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    location: '',
    categoryId: '',
    companyId: '',
    priority: 'MEDIUM',
    type: 'ISSUE',
    startedAt: '',
    dueAt: '',
    faultReportId: '',
    recurringPeriod: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isUpdatingRecurrence, setIsUpdatingRecurrence] = useState(false);
  const [recurrenceSuccess, setRecurrenceSuccess] = useState<string | null>(null);

  const loadData = async () => {
    if (!Number.isInteger(interventionId) || interventionId <= 0) {
      setLoadError(t('interventionDetail.invalidId'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const [detail, categoryList, companyList] = await Promise.all([
        getInterventionById(interventionId),
        getCategories(),
        getCompanies(),
      ]);

      setIntervention(detail);
      setCategories(categoryList.filter((c) => c.active));
      setCompanies(companyList);
      setForm({
        name: detail.name,
        description: detail.description,
        location: translateLocationValue(language, detail.location),
        categoryId: String(detail.categoryId),
        companyId: String(detail.companyId),
        priority: detail.priority,
        type: detail.type,
        startedAt: isoDateToInput(detail.startedAt),
        dueAt: isoDateToInput(detail.dueAt),
        faultReportId: detail.faultReport ? String(detail.faultReport.id) : '',
        recurringPeriod: detail.recurringPeriod ?? '',
      });
    } catch (err) {
      setLoadError(translateText(language, err instanceof Error ? err.message : t('interventionDetail.loadFailed')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [interventionId, language]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => clearFieldError(prev, field));
    setSubmitError(null);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    const nameError = validateSafeText(form.name, {
      requiredMessage: 'Name is required.',
      minLength: VALIDATION.TITLE_MIN,
      minLengthMessage: `Name must be at least ${VALIDATION.TITLE_MIN} characters.`,
      maxLength: VALIDATION.TITLE_MAX,
      maxLengthMessage: `Name must be at most ${VALIDATION.TITLE_MAX} characters.`,
      unsafeMessage: 'Name must not contain HTML or script content.',
    });
    if (nameError) errors.name = nameError;

    const descriptionError = validateSafeText(form.description, {
      requiredMessage: 'Description is required.',
      minLength: VALIDATION.DESCRIPTION_MIN,
      minLengthMessage: `Description must be at least ${VALIDATION.DESCRIPTION_MIN} characters.`,
      maxLength: VALIDATION.DESCRIPTION_MAX,
      maxLengthMessage: `Description must be at most ${VALIDATION.DESCRIPTION_MAX} characters.`,
      unsafeMessage: 'Description must not contain HTML or script content.',
    });
    if (descriptionError) errors.description = descriptionError;

    const locationError = validateSafeText(form.location, {
      requiredMessage: 'Location is required.',
      minLength: 3,
      minLengthMessage: 'Location must be at least 3 characters.',
      maxLength: 255,
      maxLengthMessage: 'Location must be at most 255 characters.',
    });
    if (locationError) errors.location = locationError;

    const categoryError = validateRequired(form.categoryId, 'Category is required.');
    if (categoryError) errors.categoryId = categoryError;

    const companyError = validateRequired(form.companyId, 'Company is required.');
    if (companyError) errors.companyId = companyError;

    if (form.startedAt.trim()) {
      const startError = validateCalendarDate(
        form.startedAt,
        'Start date is required.',
        'Start date must be in YYYY-MM-DD format.',
      );
      if (startError) errors.startedAt = startError;
    }

    if (form.dueAt.trim()) {
      const dueError = validateCalendarDate(
        form.dueAt,
        'Due date is required.',
        'Due date must be in YYYY-MM-DD format.',
      );
      if (dueError) errors.dueAt = dueError;
    }

    if (form.faultReportId.trim()) {
      const parsed = parseInt(form.faultReportId.trim(), 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        errors.faultReportId = translateText(language, 'Fault report ID must be a positive integer.');
      }
    }

    return Object.fromEntries(
      Object.entries(errors).map(([field, message]) => [field, translateText(language, message)]),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const faultReportIdRaw = form.faultReportId.trim();
      await updateIntervention(String(interventionId), {
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        categoryId: parseInt(form.categoryId, 10),
        companyId: parseInt(form.companyId, 10),
        priority: form.priority as Priority,
        startedAt: form.startedAt.trim() || undefined,
        dueAt: form.dueAt.trim() || undefined,
        faultReportId: faultReportIdRaw ? parseInt(faultReportIdRaw, 10) : null,
      });

      router.push(ROUTES.INTERVENTION(String(interventionId)));
    } catch (err: unknown) {
      const serviceDetails =
        typeof err === 'object' && err !== null
          ? (err as { details?: unknown }).details
          : undefined;
      const backendErrors = getApiFieldErrors(
        serviceDetails
          ? { response: (serviceDetails as { response?: unknown }).response }
          : err,
      );

      if (Object.keys(backendErrors).length > 0) {
        setFieldErrors(backendErrors);
      }

      setSubmitError(translateText(language, err instanceof Error ? err.message : t('interventionForm.updateFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecurrenceUpdate = async () => {
    if (!intervention) return;
    setIsUpdatingRecurrence(true);
    setSubmitError(null);
    setRecurrenceSuccess(null);

    try {
      await updateRecurrence(
        interventionId,
        form.recurringPeriod || null,
      );
      setRecurrenceSuccess(
        form.recurringPeriod
          ? t('interventionForm.recurrenceUpdated').replace(
              '{period}',
              getRecurringPeriodLabel(form.recurringPeriod, t).toLocaleLowerCase(language),
            )
          : t('interventionForm.recurrenceStopped'),
      );
    } catch (err) {
      setSubmitError(
        translateText(language, err instanceof Error ? err.message : t('interventionForm.recurrenceUpdateFailed')),
      );
    } finally {
      setIsUpdatingRecurrence(false);
    }
  };

  const isEditable = intervention && EDITABLE_STATUSES.has(intervention.status);
  const visibleCategories = useMemo(() => {
    const seen = new Set<string>();
    return categories.filter((category) => {
      const label = translateCategoryName(language, category.name).trim().toLocaleLowerCase(language);
      if (seen.has(label)) {
        return false;
      }

      seen.add(label);
      return true;
    });
  }, [categories, language]);

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={intervention ? `${t('interventionForm.edit')}: ${intervention.name}` : `${t('interventionForm.editIntervention')} #${interventionId}`}
        subtitle={t('interventionForm.editSubtitle')}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: ROUTES.DASHBOARD },
          { label: t('nav.interventions'), href: ROUTES.INTERVENTIONS },
          { label: `#${interventionId}`, href: ROUTES.INTERVENTION(String(interventionId)) },
          { label: t('interventionForm.edit') },
        ]}
        secondaryActions={[
          {
            label: t('interventionForm.cancel'),
            href: ROUTES.INTERVENTION(String(interventionId)),
            variant: 'outline',
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('interventionForm.details')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : !isEditable ? (
            <p className="text-sm text-muted-foreground">
              {t('interventionForm.notEditablePrefix')}{' '}
              <strong>{intervention?.status}</strong>. {t('interventionForm.notEditableSuffix')}
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {submitError ? (
                <p className="text-sm text-destructive">{submitError}</p>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="name">{t('interventionForm.name')} *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                />
                {fieldErrors.name ? (
                  <p id="name-error" className="text-xs text-destructive">{fieldErrors.name}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('interventionForm.description')} *</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={fieldErrors.description ? 'description-error' : undefined}
                />
                {fieldErrors.description ? (
                  <p id="description-error" className="text-xs text-destructive">{fieldErrors.description}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{t('interventionForm.location')} *</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  aria-invalid={Boolean(fieldErrors.location)}
                  aria-describedby={fieldErrors.location ? 'location-error' : undefined}
                />
                {fieldErrors.location ? (
                  <p id="location-error" className="text-xs text-destructive">{fieldErrors.location}</p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">{t('interventionForm.category')} *</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => handleChange('categoryId', v ?? '')}
                  >
                    <SelectTrigger
                      id="category"
                      aria-invalid={Boolean(fieldErrors.categoryId)}
                      aria-describedby={fieldErrors.categoryId ? 'category-error' : undefined}
                    >
                      <SelectValue>
                        {categories.find((c) => String(c.id) === form.categoryId)
                          ? translateCategoryName(language, categories.find((c) => String(c.id) === form.categoryId)?.name ?? '')
                          : t('interventionForm.selectCategory')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {visibleCategories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {translateCategoryName(language, c.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.categoryId ? (
                    <p id="category-error" className="text-xs text-destructive">{fieldErrors.categoryId}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">{t('interventionForm.company')} *</Label>
                  <Select
                    value={form.companyId}
                    onValueChange={(v) => handleChange('companyId', v ?? '')}
                  >
                    <SelectTrigger
                      id="company"
                      aria-invalid={Boolean(fieldErrors.companyId)}
                      aria-describedby={fieldErrors.companyId ? 'company-error' : undefined}
                    >
                      <SelectValue>
                        {companies.find((c) => String(c.id) === form.companyId)?.name ?? t('interventionForm.selectCompany')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.companyId ? (
                    <p id="company-error" className="text-xs text-destructive">{fieldErrors.companyId}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priority">{t('interventionForm.priority')}</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => handleChange('priority', v ?? '')}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue>{translatePriority(language, form.priority)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {translatePriority(language, o.value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">{t('interventionForm.type')}</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => handleChange('type', v ?? '')}
                  >
                    <SelectTrigger id="type">
                      <SelectValue>{getTypeLabel(form.type, t)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {t(o.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startedAt">{t('interventionForm.startDateOptional')}</Label>
                  <Input
                    id="startedAt"
                    type="date"
                    value={form.startedAt}
                    onChange={(e) => handleChange('startedAt', e.target.value)}
                    aria-invalid={Boolean(fieldErrors.startedAt)}
                    aria-describedby={fieldErrors.startedAt ? 'startedAt-error' : undefined}
                  />
                  {fieldErrors.startedAt ? (
                    <p id="startedAt-error" className="text-xs text-destructive">{fieldErrors.startedAt}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueAt">{t('interventionForm.dueDateOptional')}</Label>
                  <Input
                    id="dueAt"
                    type="date"
                    value={form.dueAt}
                    onChange={(e) => handleChange('dueAt', e.target.value)}
                    aria-invalid={Boolean(fieldErrors.dueAt)}
                    aria-describedby={fieldErrors.dueAt ? 'dueAt-error' : undefined}
                  />
                  {fieldErrors.dueAt ? (
                    <p id="dueAt-error" className="text-xs text-destructive">{fieldErrors.dueAt}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="faultReportId">
                  {t('interventionForm.faultReportIdOptional')}
                </Label>
                <Input
                  id="faultReportId"
                  type="number"
                  min={1}
                  value={form.faultReportId}
                  onChange={(e) => handleChange('faultReportId', e.target.value)}
                  placeholder="e.g. 42"
                  aria-invalid={Boolean(fieldErrors.faultReportId)}
                  aria-describedby={fieldErrors.faultReportId ? 'faultReportId-error' : undefined}
                />
                {fieldErrors.faultReportId ? (
                  <p id="faultReportId-error" className="text-xs text-destructive">{fieldErrors.faultReportId}</p>
                ) : null}
              </div>

             <div className="space-y-2">
                <Label htmlFor="recurringPeriod">{t('interventionForm.recurrence')}</Label>
                <Select
                  value={form.recurringPeriod}
                  onValueChange={(v) => handleChange('recurringPeriod', v ?? '')}
                >
                  <SelectTrigger id="recurringPeriod">
                    <SelectValue placeholder={t('interventionForm.noRecurrence')}>
                      {getRecurringPeriodLabel(form.recurringPeriod, t)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRING_PERIOD_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {t(o.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {recurrenceSuccess ? (
                  <p className="text-xs text-emerald-600">{recurrenceSuccess}</p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdatingRecurrence}
                  onClick={() => { void handleRecurrenceUpdate(); }}
                >
                  {isUpdatingRecurrence ? t('interventionForm.saving') : t('interventionForm.updateRecurrence')}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('interventionForm.saving') : t('interventionForm.saveChanges')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
