'use client';

export const runtime = 'edge';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  validateRequired,
  validateSafeText,
  type FieldErrors,
} from '@/lib/form-validation';
import { getCategories } from '@/services/categories.service';
import { getCompanies } from '@/services/companies.service';
import type { Priority } from '@shared/enums';
import { createIntervention } from '@/services/interventions.service';
import {
  translateCategoryName,
  translatePriority,
  translateText,
  useI18n,
  type TranslationKey,
} from '@/lib/i18n';

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

const INITIAL_FORM: FormState = {
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
};

function getTypeLabel(type: string, t: (key: TranslationKey) => string): string {
  return t(TYPE_OPTIONS.find((option) => option.value === type)?.labelKey ?? 'interventionForm.issueReactive');
}

function getRecurringPeriodLabel(value: string, t: (key: TranslationKey) => string): string {
  return t(
    RECURRING_PERIOD_OPTIONS.find((option) => option.value === value)?.labelKey ?? 'interventionForm.noRecurrence',
  );
}

function getCurrentDatetimeLocal() {
  const now = new Date();
  now.setSeconds(0, 0);
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function isValidDatetimeLocal(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

function datetimeLocalToIso(value: string) {
  return new Date(value).toISOString();
}

export default function NewInterventionPage() {
  const router = useRouter();
  const { language, t } = useI18n();

  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOptions = async () => {
    try {
      setIsLoadingOptions(true);
      setOptionsError(null);
      const [categoryList, companyList] = await Promise.all([getCategories(), getCompanies()]);
      setCategories(categoryList.filter((c) => c.active));
      setCompanies(companyList);
    } catch (err) {
      setOptionsError(translateText(language, err instanceof Error ? err.message : t('interventionForm.loadOptionsFailed')));
    } finally {
      setIsLoadingOptions(false);
    }
  };

  useEffect(() => {
    void loadOptions();
  }, [language]);

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
      if (!isValidDatetimeLocal(form.startedAt)) {
        errors.startedAt = 'Start date must include a valid date and time.';
      } else if (form.startedAt < getCurrentDatetimeLocal()) {
        errors.startedAt = 'Planned start date cannot be in the past.';
      }
    }

    if (form.dueAt.trim()) {
      if (!isValidDatetimeLocal(form.dueAt)) {
        errors.dueAt = 'Due date must include a valid date and time.';
      } else if (form.dueAt < getCurrentDatetimeLocal()) {
        errors.dueAt = 'Due date cannot be in the past.';
      }
    }

    if (
      form.startedAt.trim() &&
      form.dueAt.trim() &&
      isValidDatetimeLocal(form.startedAt) &&
      isValidDatetimeLocal(form.dueAt) &&
      new Date(form.dueAt) < new Date(form.startedAt)
    ) {
      errors.dueAt = 'Due date must be after or equal to planned start date.';
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

  const handleSubmit = async (event: React.FormEvent) => {
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
      await createIntervention({
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        categoryId: parseInt(form.categoryId, 10),
        companyId: parseInt(form.companyId, 10),
        priority: form.priority as Priority,
        startedAt: form.startedAt.trim() ? datetimeLocalToIso(form.startedAt.trim()) : undefined,
        dueAt: form.dueAt.trim() ? datetimeLocalToIso(form.dueAt.trim()) : undefined,
        faultReportId: faultReportIdRaw ? parseInt(faultReportIdRaw, 10) : null,
        recurringPeriod: form.recurringPeriod || null,
      });

      router.push(ROUTES.INTERVENTIONS);
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

      setSubmitError(translateText(language, err instanceof Error ? err.message : t('interventionForm.createFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={t('nav.newIntervention')}
        subtitle={t('interventionForm.subtitle')}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: ROUTES.DASHBOARD },
          { label: t('nav.interventions'), href: ROUTES.INTERVENTIONS },
          { label: t('interventionForm.newBreadcrumb') },
        ]}
        secondaryActions={[
          { label: t('interventionForm.cancel'), href: ROUTES.INTERVENTIONS, variant: 'outline' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('interventionForm.details')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingOptions ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : optionsError ? (
            <p className="text-sm text-destructive">{optionsError}</p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

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
                    type="datetime-local"
                    min={getCurrentDatetimeLocal()}
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
                    type="datetime-local"
                    min={getCurrentDatetimeLocal()}
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
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('interventionForm.creating') : t('interventionForm.create')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
