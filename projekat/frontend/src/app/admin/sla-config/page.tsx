'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';

import { ROUTES, UI } from '@/constants';
import { DataTable, PageHeader, PageLayout, PriorityBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PRIORITY_OPTIONS, type Priority } from '@shared/enums';
import {
  getSlaConfigurations,
  updateSlaConfigurations,
  type SlaConfiguration,
} from '@/services/sla.service';

const PRIORITY_FIELD_KEYS = new Set(PRIORITY_OPTIONS.map((priority) => `${priority}_hours`));

function mapBackendErrors(backendErrors: Record<string, string>): Record<string, string> {
  const mappedErrors: Record<string, string> = {};

  for (const [key, message] of Object.entries(backendErrors)) {
    if (PRIORITY_FIELD_KEYS.has(key)) {
      mappedErrors[key] = message;
      continue;
    }

    if (key.startsWith('config_')) {
      for (const priority of PRIORITY_OPTIONS) {
        if (String(message).includes(priority)) {
          mappedErrors[`${priority}_hours`] = message;
          break;
        }
      }
    }
  }

  return mappedErrors;
}

export default function AdminSlaConfigPage() {
  const [configs, setConfigs] = useState<SlaConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState<Record<Priority, string>>(() =>
    PRIORITY_OPTIONS.reduce(
      (accumulator, priority) => ({ ...accumulator, [priority]: '' }),
      {} as Record<Priority, string>,
    ),
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const formatDate = (date?: string) => {
    if (!date) {
      return '-';
    }

    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleDateString('bs-BA');
  };

  const fetchSlaConfigs = async () => {
    try {
      setLoading(true);
      const configurations = await getSlaConfigurations();
      setConfigs(configurations);

      const nextFormData = PRIORITY_OPTIONS.reduce(
        (accumulator, priority) => ({ ...accumulator, [priority]: '' }),
        {} as Record<Priority, string>,
      );

      configurations.forEach((config) => {
        nextFormData[config.priority] = String(config.deadlineHours);
      });

      setFormData(nextFormData);
      setFieldErrors({});
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load SLA configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSlaConfigs();
  }, []);

  const validateField = (_priority: Priority, value: string): string => {
    if (value === '') {
      return 'Value cannot be empty';
    }

    const numericValue = Number(value);

    if (!Number.isInteger(numericValue)) {
      return 'Must be a whole number';
    }

    if (numericValue <= 0) {
      return 'Must be greater than 0';
    }

    if (numericValue > 8760) {
      return 'Maximum is 8760 hours';
    }

    return '';
  };

  const handleInputChange = (priority: Priority, value: string) => {
    setFormData((previous) => ({ ...previous, [priority]: value }));

    const validationError = validateField(priority, value);
    const fieldKey = `${priority}_hours`;

    setFieldErrors((previous) => {
      const next = { ...previous };

      if (validationError) {
        next[fieldKey] = validationError;
      } else {
        delete next[fieldKey];
      }

      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const validationErrors: Record<string, string> = {};

    for (const priority of PRIORITY_OPTIONS) {
      const validationError = validateField(priority, formData[priority]);
      if (validationError) {
        validationErrors[`${priority}_hours`] = validationError;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);

      const configurations = PRIORITY_OPTIONS.map((priority) => ({
        priority,
        deadlineHours: Number.parseInt(formData[priority], 10),
      }));

      await updateSlaConfigurations({ configurations });
      await fetchSlaConfigs();
      setSuccessMessage('SLA configuration updated successfully.');
    } catch (requestError) {
      const maybeErrors =
        typeof requestError === 'object' && requestError !== null
          ? (requestError as { details?: { response?: { data?: { errors?: Record<string, string> } } } }).details
              ?.response?.data?.errors ?? {}
          : {};

      setFieldErrors(mapBackendErrors(maybeErrors));
      setError(requestError instanceof Error ? requestError.message : 'Failed to update SLA configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="SLA Configuration"
        subtitle="Define deadline hours for each intervention priority."
        breadcrumbs={[{ label: 'Admin', href: ROUTES.ADMIN }, { label: 'SLA Configuration' }]}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Update SLA</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {PRIORITY_OPTIONS.map((priority) => (
                  <div key={`skeleton-${priority}`} className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {PRIORITY_OPTIONS.map((priority) => {
                  const key = `${priority}_hours`;
                  const hasError = key in fieldErrors;

                  return (
                    <div key={priority} className="space-y-2">
                      <Label htmlFor={key}>{priority}</Label>
                      <Input
                        id={key}
                        type="number"
                        value={formData[priority]}
                        onChange={(event) => handleInputChange(priority, event.target.value)}
                        aria-invalid={hasError}
                      />
                      {hasError ? <p className="text-xs text-destructive">{fieldErrors[key]}</p> : null}
                    </div>
                  );
                })}

                <Button
                  type="submit"
                  disabled={saving || Object.keys(fieldErrors).length > 0}
                  className="w-full"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable<SlaConfiguration>
              columns={[
                {
                  key: 'priority',
                  header: 'Priority',
                  render: (value) => <PriorityBadge priority={value as Priority} />,
                },
                { key: 'deadlineHours', header: 'Hours', width: UI.TABLE_COLUMN_WIDTHS.SLA_HOURS },
                {
                  key: 'updatedAt',
                  header: 'Updated',
                  render: (value) => formatDate(String(value)),
                },
              ]}
              data={configs}
              keyExtractor={(row) => row.priority}
              isLoading={loading}
              emptyTitle="No SLA data"
              emptyDescription="Seed or configure SLA values to continue."
              error={null}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
