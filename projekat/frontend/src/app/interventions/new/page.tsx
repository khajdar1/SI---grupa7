'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
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
  validateCalendarDate,
  validateRequired,
  validateSafeText,
  type FieldErrors,
} from '@/lib/form-validation';
import { getCategories } from '@/services/categories.service';
import { getCompanies } from '@/services/companies.service';
import type { Priority } from '@shared/enums';
import { createIntervention } from '@/services/interventions.service';

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
] as const;

const TYPE_OPTIONS = [
  { value: 'ISSUE', label: 'Issue (reactive)' },
  { value: 'PREVENTIVE', label: 'Preventive maintenance' },
] as const;

const RECURRING_PERIOD_OPTIONS = [
  { value: '', label: 'No recurrence' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
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

export default function NewInterventionPage() {
  const router = useRouter();

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
      setOptionsError(err instanceof Error ? err.message : 'Failed to load form options.');
    } finally {
      setIsLoadingOptions(false);
    }
  };

  useEffect(() => {
    void loadOptions();
  }, []);

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
        errors.faultReportId = 'Fault report ID must be a positive integer.';
      }
    }

    return errors;
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
        startedAt: form.startedAt.trim() || undefined,
        dueAt: form.dueAt.trim() || undefined,
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

      setSubmitError(err instanceof Error ? err.message : 'Failed to create intervention.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="New Intervention"
        subtitle="Plan and schedule an intervention with or without a fault report."
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Interventions', href: ROUTES.INTERVENTIONS },
          { label: 'New' },
        ]}
        secondaryActions={[
          { label: 'Cancel', href: ROUTES.INTERVENTIONS, variant: 'outline' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Intervention Details</CardTitle>
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
                <Label htmlFor="name">Name *</Label>
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
                <Label htmlFor="description">Description *</Label>
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
                <Label htmlFor="location">Location *</Label>
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
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => handleChange('categoryId', v ?? '')}
                  >
                    <SelectTrigger
                      id="category"
                      aria-invalid={Boolean(fieldErrors.categoryId)}
                      aria-describedby={fieldErrors.categoryId ? 'category-error' : undefined}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.categoryId ? (
                    <p id="category-error" className="text-xs text-destructive">{fieldErrors.categoryId}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Select
                    value={form.companyId}
                    onValueChange={(v) => handleChange('companyId', v ?? '')}
                  >
                    <SelectTrigger
                      id="company"
                      aria-invalid={Boolean(fieldErrors.companyId)}
                      aria-describedby={fieldErrors.companyId ? 'company-error' : undefined}
                    >
                      <SelectValue placeholder="Select company" />
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
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => handleChange('priority', v ?? '')}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => handleChange('type', v ?? '')}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startedAt">Start Date (optional)</Label>
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
                  <Label htmlFor="dueAt">Due Date (optional)</Label>
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
                  Fault Report ID (optional — link to existing report)
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
                <Label htmlFor="recurringPeriod">Recurrence</Label>
                <Select
                  value={form.recurringPeriod}
                  onValueChange={(v) => handleChange('recurringPeriod', v ?? '')}
                >
                  <SelectTrigger id="recurringPeriod">
                    <SelectValue placeholder="No recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRING_PERIOD_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Intervention'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
