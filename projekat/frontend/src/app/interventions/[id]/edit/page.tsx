'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
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
import { getCategories } from '@/services/categories.service';
import { getCompanies } from '@/services/companies.service';
import type { Priority } from '@shared/enums';
import {
  getInterventionById,
  updateIntervention,
  type InterventionDetail,
} from '@/services/interventions.service';

const EDITABLE_STATUSES = new Set(['NEW', 'IN_PROGRESS']);

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
}

function isoDateToInput(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export default function EditInterventionPage() {
  const params = useParams();
  const router = useRouter();
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
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!Number.isInteger(interventionId) || interventionId <= 0) {
      setLoadError('Invalid intervention identifier.');
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
        location: detail.location,
        categoryId: String(detail.category.id),
        companyId: String(detail.company.id),
        priority: detail.priority,
        type: detail.type,
        startedAt: isoDateToInput(detail.startedAt),
        dueAt: isoDateToInput(detail.dueAt),
        faultReportId: detail.faultReport ? String(detail.faultReport.id) : '',
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load intervention.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [interventionId]);

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

      setSubmitError(err instanceof Error ? err.message : 'Failed to update intervention.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditable = intervention && EDITABLE_STATUSES.has(intervention.status);

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={intervention ? `Edit: ${intervention.name}` : `Edit Intervention #${interventionId}`}
        subtitle="Modify intervention details. Editing is only allowed while the status is Open or In Progress."
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Interventions', href: ROUTES.INTERVENTIONS },
          { label: `#${interventionId}`, href: ROUTES.INTERVENTION(String(interventionId)) },
          { label: 'Edit' },
        ]}
        secondaryActions={[
          {
            label: 'Cancel',
            href: ROUTES.INTERVENTION(String(interventionId)),
            variant: 'outline',
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Intervention Details</CardTitle>
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
              This intervention cannot be edited because its current status is{' '}
              <strong>{intervention?.status}</strong>. Only interventions with status Open or In
              Progress can be modified.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {submitError ? (
                <p className="text-sm text-destructive">{submitError}</p>
              ) : null}

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

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
