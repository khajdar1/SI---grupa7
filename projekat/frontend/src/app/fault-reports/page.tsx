'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { EmptyState, PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES, UI } from '@/constants';
import { hasSessionRole } from '@/lib/auth';
import { clearFieldError, getApiFieldErrors, validateRequired } from '@/lib/form-validation';
import type {
  FaultReportCategoryOption,
  FaultReportCompanyOption,
  FaultReportListItem,
  PotentialDuplicateItem,
} from '@/models/FaultReport';
import {
  getFaultReportOptions,
  getFaultReports,
  submitFaultReport,
  checkFaultReportDuplicates,
} from '@/services/fault-reports.service';
import { DuplicateWarningDialog } from '@/components/fault-reports/DuplicateWarningDialog';

type ReportMode = 'regular' | 'emergency';

type EmergencyTemplate = {
  id: string;
  label: string;
  description: string;
};

const EMERGENCY_TEMPLATES: readonly EmergencyTemplate[] = [
  {
    id: 'power-outage',
    label: 'Power Outage',
    description: 'Complete or partial power outage requiring immediate response.',
  },
  {
    id: 'water-leak',
    label: 'Water Leak',
    description: 'Flooding, pipe failure, or continuous leak on site.',
  },
  {
    id: 'elevator-failure',
    label: 'Elevator Failure',
    description: 'Elevator stall or malfunction with potential safety impact.',
  },
  {
    id: 'network-outage',
    label: 'Network Outage',
    description: 'Critical network connectivity incident affecting operations.',
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPPORT_AGENT_ROLE_NAMES = new Set(['supportagent', 'agentpodrske']);

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to process attachment.'));
        return;
      }

      const [, content = ''] = reader.result.split(',');
      resolve(content);
    };

    reader.onerror = () => reject(new Error('Failed to read attachment.'));
    reader.readAsDataURL(file);
  });
}

function inferMimeType(file: File): string {
  return file.type?.trim() || 'application/octet-stream';
}

export default function FaultReportsPage() {
  const [reportMode, setReportMode] = useState<ReportMode>('emergency');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSupportAgent, setIsSupportAgent] = useState(false);
  const [faultReports, setFaultReports] = useState<FaultReportListItem[]>([]);

  const [companies, setCompanies] = useState<FaultReportCompanyOption[]>([]);
  const [categories, setCategories] = useState<FaultReportCategoryOption[]>([]);

  const [companyId, setCompanyId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [description, setDescription] = useState('');

  const [templateId, setTemplateId] = useState(EMERGENCY_TEMPLATES[0].id);
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [createdInterventionId, setCreatedInterventionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PBI-025: duplicate detection state
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState<PotentialDuplicateItem[]>([]);
  const pendingSubmitRef = useRef<(() => Promise<void>) | null>(null);

  const selectedTemplate = useMemo(
    () => EMERGENCY_TEMPLATES.find((template) => template.id === templateId) ?? EMERGENCY_TEMPLATES[0],
    [templateId],
  );

  const loadOptions = async () => {
    try {
      setIsLoading(true);
      const options = await getFaultReportOptions();
      const activeCategories = options.categories.filter((category) => category.active);

      setCompanies(options.companies);
      setCategories(activeCategories);
      setError('');

      if (options.companies.length > 0 && !companyId) {
        setCompanyId(String(options.companies[0].id));
      }

      if (activeCategories.length > 0 && !categoryId) {
        setCategoryId(String(activeCategories[0].id));
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load intake options.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFaultReports = async () => {
    try {
      setIsLoading(true);
      const reports = await getFaultReports();
      setFaultReports(reports);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load fault reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = window.localStorage.getItem('token');
    const authenticated = Boolean(token);
    const supportAgent = hasSessionRole(SUPPORT_AGENT_ROLE_NAMES);

    setIsAuthenticated(authenticated);
    setIsSupportAgent(supportAgent);
    setReportMode(authenticated ? 'regular' : 'emergency');

    if (supportAgent) {
      void loadFaultReports();
      return;
    }

    void loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearError = (field: string) => {
    setFieldErrors((previous) => clearFieldError(previous, field));
    setSuccessMessage('');
    setCreatedInterventionId(null);
    setError('');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFieldErrors((current) => ({ ...current, location: 'Geolocation is not supported on this device.' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = Number(position.coords.latitude.toFixed(6));
        const nextLongitude = Number(position.coords.longitude.toFixed(6));
        setLatitude(nextLatitude);
        setLongitude(nextLongitude);
        setLocation(`Detected location (${nextLatitude}, ${nextLongitude})`);
        clearError('location');
      },
      () => {
        setFieldErrors((current) => ({
          ...current,
          location: 'Location access failed. Allow permission or enter location manually.',
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (selectedFiles.length === 0) {
      return;
    }

    const acceptedFiles = selectedFiles.filter((file) => file.size <= UI.MAX_FILE_SIZE_MB * 1024 * 1024);
    const rejectedFiles = selectedFiles.length - acceptedFiles.length;

    setAttachments((current) => [...current, ...acceptedFiles]);

    if (rejectedFiles > 0) {
      setFieldErrors((current) => ({
        ...current,
        attachments: `${rejectedFiles} attachment(s) exceeded ${UI.MAX_FILE_SIZE_MB} MB limit.`,
      }));
      return;
    }

    clearError('attachments');
  };

  const removeAttachment = (index: number) => {
    setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const validateForm = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};

    if (reportMode === 'regular') {
      const companyError = validateRequired(companyId, 'Company is required.');
      const categoryError = validateRequired(categoryId, 'Category is required.');
      const locationError = validateRequired(location, 'Location is required.');
      const descriptionError = validateRequired(description, 'Description is required.');

      if (companyError) nextErrors.companyId = companyError;
      if (categoryError) nextErrors.categoryId = categoryError;
      if (locationError) nextErrors.location = locationError;
      if (descriptionError) nextErrors.description = descriptionError;

      if (!locationError && location.trim().length < 3) {
        nextErrors.location = 'Location must have at least 3 characters.';
      }
    }

    if (reportMode === 'emergency' && !isAuthenticated) {
      const reporterNameError = validateRequired(reporterName, 'Reporter name is required.');
      const reporterPhoneError = validateRequired(reporterPhone, 'Reporter phone is required.');

      if (reporterNameError) nextErrors.reporterName = reporterNameError;
      if (reporterPhoneError) nextErrors.reporterPhone = reporterPhoneError;

      if (!reporterPhoneError && reporterPhone.trim().length < 5) {
        nextErrors.reporterPhone = 'Reporter phone must have at least 5 characters.';
      }
    }

    if (reporterEmail.trim().length > 0 && !EMAIL_REGEX.test(reporterEmail.trim())) {
      nextErrors.reporterEmail = 'Invalid email format.';
    }

    return nextErrors;
  };

  /** Performs the actual report creation after duplicate confirmation or when no warning is needed. */
  const doSubmit = async () => {
    setError('');
    setSuccessMessage('');
    setCreatedInterventionId(null);
    setIsSubmitting(true);

    try {
      const attachmentPayload = await Promise.all(
        attachments.map(async (file) => ({
          fileName: file.name,
          mimeType: inferMimeType(file),
          fileSize: file.size,
          fileContent: await readFileAsBase64(file),
        })),
      );

      const payload =
        reportMode === 'regular'
          ? {
              templateId: 'regular-report',
              templateName: 'Regular Report',
              isAuthenticated: true,
              companyId: Number(companyId),
              categoryId: Number(categoryId),
              location: location.trim(),
              description: description.trim(),
              reporterName: '',
              reporterEmail: '',
              reporterPhone: '',
              latitude,
              longitude,
              attachments: attachmentPayload,
            }
          : {
              templateId: selectedTemplate.id,
              templateName: selectedTemplate.label,
              isAuthenticated,
              companyId: companyId ? Number(companyId) : undefined,
              categoryId: categoryId ? Number(categoryId) : undefined,
              location: location.trim(),
              description: description.trim(),
              reporterName: reporterName.trim(),
              reporterEmail: reporterEmail.trim(),
              reporterPhone: reporterPhone.trim(),
              latitude,
              longitude,
              attachments: attachmentPayload,
            };

      const response = await submitFaultReport(payload);
      setSuccessMessage(
        `Report submitted successfully. Reference ${response.referenceNumber} created.`,
      );
      setCreatedInterventionId(response.interventionId);

      setLocation('');
      setDescription('');
      setReporterName('');
      setReporterEmail('');
      setReporterPhone('');
      setLatitude(null);
      setLongitude(null);
      setAttachments([]);
      setTemplateId(EMERGENCY_TEMPLATES[0].id);
    } catch (requestError: unknown) {
      const serviceDetails =
        typeof requestError === 'object' && requestError !== null
          ? (requestError as { details?: unknown }).details
          : undefined;
      const backendFieldErrors = getApiFieldErrors(
        serviceDetails ? { response: (serviceDetails as { response?: unknown }).response } : requestError,
      );

      if (Object.keys(backendFieldErrors).length > 0) {
        setFieldErrors(backendFieldErrors);
      }

      setError(requestError instanceof Error ? requestError.message : 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setCreatedInterventionId(null);

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    // PBI-025: Check duplicates for authenticated users in regular mode.
    if (reportMode === 'regular' && isAuthenticated && companyId) {
      try {
        // Read userId from the localStorage user object.
        let userId: number | null = null;
        const raw = window.localStorage.getItem('user');
        if (raw) {
          const parsed = JSON.parse(raw) as { id?: number };
          userId = parsed.id ?? null;
        }

        if (userId) {
          const checkResult = await checkFaultReportDuplicates({
            userId,
            companyId: Number(companyId),
            location: location.trim(),
            description: description.trim(),
            latitude,
            longitude,
          });

          if (checkResult.hasPotentialDuplicates) {
            setPotentialDuplicates(checkResult.duplicates);
            pendingSubmitRef.current = doSubmit;
            setDuplicateWarningOpen(true);
            return;
          }
        }
      } catch {
        // Duplicate-check failures should not block report submission.
      }
    }

    await doSubmit();
  };

  const noIntakeOptions = companies.length === 0 || categories.length === 0;

  if (isSupportAgent) {
    return (
      <PageLayout className="space-y-6">
        <PageHeader
          title="Fault Reports"
          subtitle="Review submitted fault reports and related intervention status."
          breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Fault Reports' }]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Submitted Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <EmptyState
                title="Fault reports unavailable"
                description={error}
                action={{ label: 'Retry', onClick: () => void loadFaultReports() }}
              />
            ) : faultReports.length === 0 ? (
              <EmptyState
                title="No fault reports"
                description="There are no submitted fault reports to review right now."
              />
            ) : (
              <div className="space-y-3">
                {faultReports.map((report) => {
                  const latestIntervention = [...report.interventions].sort(
                    (leftIntervention, rightIntervention) =>
                      new Date(rightIntervention.createdAt).getTime() -
                      new Date(leftIntervention.createdAt).getTime(),
                  )[0];

                  return (
                    <div key={report.id} className="rounded-lg border bg-card p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">FR-{String(report.id).padStart(5, '0')}</span>
                            <Badge variant="outline">{report.category.name}</Badge>
                            {latestIntervention ? (
                              <Badge variant="secondary">{latestIntervention.status.replace(/_/g, ' ')}</Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-foreground line-clamp-2">{report.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {report.company.name} - {report.location || 'No location'} - {formatDateTime(report.reportedAt)}
                          </p>
                        </div>

                        {latestIntervention ? (
                          <Button asChild variant="outline" size="sm" className="shrink-0">
                            <Link href={ROUTES.INTERVENTION(String(latestIntervention.id))}>
                              Open intervention
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="space-y-6">
      {/* PBI-025: Duplicate warning dialog */}
      <DuplicateWarningDialog
        open={duplicateWarningOpen}
        duplicates={potentialDuplicates}
        onContinue={() => {
          setDuplicateWarningOpen(false);
          if (pendingSubmitRef.current) {
            void pendingSubmitRef.current();
            pendingSubmitRef.current = null;
          }
        }}
        onCancel={() => {
          setDuplicateWarningOpen(false);
          pendingSubmitRef.current = null;
        }}
      />
      <PageHeader
        title="Fault Reports"
        subtitle="Report incidents quickly and route them into intervention workflow."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Fault Reports' }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Submit Fault Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : error && noIntakeOptions ? (
            <EmptyState
              title="Intake options unavailable"
              description={error}
              action={{ label: 'Retry', onClick: () => void loadOptions() }}
            />
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {successMessage ? (
                <div className="space-y-1 text-sm text-emerald-600">
                  <p>{successMessage}</p>
                  {createdInterventionId ? (
                    <Link
                      href={ROUTES.INTERVENTION(String(createdInterventionId))}
                      className="font-medium underline underline-offset-4"
                    >
                      Open intervention #{createdInterventionId}
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {isAuthenticated ? (
                  <>
                    <Button
                      type="button"
                      variant={reportMode === 'regular' ? 'default' : 'outline'}
                      onClick={() => setReportMode('regular')}
                    >
                      Regular
                    </Button>
                    <Button
                      type="button"
                      variant={reportMode === 'emergency' ? 'default' : 'outline'}
                      onClick={() => setReportMode('emergency')}
                    >
                      Emergency
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Guest users can submit emergency reports only.
                  </p>
                )}
              </div>

              {reportMode === 'regular' ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Select
                        value={companyId}
                        onValueChange={(value) => {
                          setCompanyId(value ?? '');
                          clearError('companyId');
                        }}
                      >
                        <SelectTrigger
                          id="company"
                          aria-invalid={Boolean(fieldErrors.companyId)}
                          aria-describedby={fieldErrors.companyId ? 'company-error' : undefined}
                        >
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={String(company.id)}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.companyId ? (
                        <p id="company-error" className="text-xs text-destructive">
                          {fieldErrors.companyId}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={categoryId}
                        onValueChange={(value) => {
                          setCategoryId(value ?? '');
                          clearError('categoryId');
                        }}
                      >
                        <SelectTrigger
                          id="category"
                          aria-invalid={Boolean(fieldErrors.categoryId)}
                          aria-describedby={fieldErrors.categoryId ? 'category-error' : undefined}
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.categoryId ? (
                        <p id="category-error" className="text-xs text-destructive">
                          {fieldErrors.categoryId}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(event) => {
                        setLocation(event.target.value);
                        clearError('location');
                      }}
                      aria-invalid={Boolean(fieldErrors.location)}
                      aria-describedby={fieldErrors.location ? 'location-error' : undefined}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={handleUseCurrentLocation}>
                        Use Current Location
                      </Button>
                      {latitude !== null && longitude !== null ? (
                        <p className="self-center text-xs text-muted-foreground">
                          Coordinates: {latitude}, {longitude}
                        </p>
                      ) : null}
                    </div>
                    {fieldErrors.location ? (
                      <p id="location-error" className="text-xs text-destructive">
                        {fieldErrors.location}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(event) => {
                        setDescription(event.target.value);
                        clearError('description');
                      }}
                      aria-invalid={Boolean(fieldErrors.description)}
                      aria-describedby={fieldErrors.description ? 'description-error' : undefined}
                    />
                    {fieldErrors.description ? (
                      <p id="description-error" className="text-xs text-destructive">
                        {fieldErrors.description}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="template">Emergency Type</Label>
                    <Select
                      value={templateId}
                      onValueChange={(value) => {
                        setTemplateId(value ?? EMERGENCY_TEMPLATES[0].id);
                      }}
                    >
                      <SelectTrigger id="template">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMERGENCY_TEMPLATES.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                  </div>

                  {!isAuthenticated ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="reporter-name">Reporter Name</Label>
                        <Input
                          id="reporter-name"
                          value={reporterName}
                          onChange={(event) => {
                            setReporterName(event.target.value);
                            clearError('reporterName');
                          }}
                          aria-invalid={Boolean(fieldErrors.reporterName)}
                          aria-describedby={fieldErrors.reporterName ? 'reporter-name-error' : undefined}
                        />
                        {fieldErrors.reporterName ? (
                          <p id="reporter-name-error" className="text-xs text-destructive">
                            {fieldErrors.reporterName}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reporter-phone">Reporter Phone</Label>
                        <Input
                          id="reporter-phone"
                          value={reporterPhone}
                          onChange={(event) => {
                            setReporterPhone(event.target.value);
                            clearError('reporterPhone');
                          }}
                          aria-invalid={Boolean(fieldErrors.reporterPhone)}
                          aria-describedby={fieldErrors.reporterPhone ? 'reporter-phone-error' : undefined}
                        />
                        {fieldErrors.reporterPhone ? (
                          <p id="reporter-phone-error" className="text-xs text-destructive">
                            {fieldErrors.reporterPhone}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="reporter-email">
                  Reporter Email {isAuthenticated ? '(optional)' : '(optional for guests)'}
                </Label>
                <Input
                  id="reporter-email"
                  type="email"
                  value={reporterEmail}
                  onChange={(event) => {
                    setReporterEmail(event.target.value);
                    clearError('reporterEmail');
                  }}
                  aria-invalid={Boolean(fieldErrors.reporterEmail)}
                  aria-describedby={fieldErrors.reporterEmail ? 'reporter-email-error' : undefined}
                />
                {fieldErrors.reporterEmail ? (
                  <p id="reporter-email-error" className="text-xs text-destructive">
                    {fieldErrors.reporterEmail}
                  </p>
                ) : null}
              </div>

              {isAuthenticated ? (
                <div className="space-y-2">
                  <Label htmlFor="attachments">
                    Attachments (max {UI.MAX_FILE_SIZE_MB} MB per file)
                  </Label>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleAttachmentChange}
                    aria-invalid={Boolean(fieldErrors.attachments)}
                    aria-describedby={fieldErrors.attachments ? 'attachments-error' : undefined}
                  />
                  {attachments.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md border p-2">
                          <p className="truncate text-xs text-muted-foreground">
                            {file.name} ({Math.round(file.size / 1024)} KB)
                          </p>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {fieldErrors.attachments ? (
                    <p id="attachments-error" className="text-xs text-destructive">
                      {fieldErrors.attachments}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || noIntakeOptions}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Fault Report'}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href={ROUTES.INTERVENTIONS}>View Interventions</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
