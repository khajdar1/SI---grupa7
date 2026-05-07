'use client';

import { useEffect, useState } from 'react';

import { ROUTES } from '@/constants';
import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAttachmentConfig,
  updateAttachmentConfig,
  type AttachmentConfig,
} from '@/services/attachments.service';

export default function AdminAttachmentConfigPage() {
  const [config, setConfig] = useState<AttachmentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [newMimeType, setNewMimeType] = useState('');
  const [newMimeTypeError, setNewMimeTypeError] = useState('');
  const [maxSizeInput, setMaxSizeInput] = useState('');
  const [maxSizeError, setMaxSizeError] = useState('');

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAttachmentConfig();
      setConfig(data);
      setMaxSizeInput(String(data.maxFileSizeMb));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchConfig();
  }, []);

  const handleRemoveMimeType = (type: string) => {
    if (!config) return;
    setConfig({ ...config, allowedMimeTypes: config.allowedMimeTypes.filter((t) => t !== type) });
    setSuccessMessage('');
  };

  const validateNewMimeType = (value: string): string => {
    if (!value.trim()) return 'MIME type cannot be empty.';
    if (!/^[\w-]+\/[\w.+\-*]+$/.test(value.trim())) return 'Invalid MIME type format (e.g. image/jpeg).';
    if (config?.allowedMimeTypes.includes(value.trim())) return 'This MIME type is already in the list.';
    return '';
  };

  const handleAddMimeType = () => {
    const trimmed = newMimeType.trim();
    const validationError = validateNewMimeType(trimmed);
    if (validationError) {
      setNewMimeTypeError(validationError);
      return;
    }
    if (!config) return;
    setConfig({ ...config, allowedMimeTypes: [...config.allowedMimeTypes, trimmed] });
    setNewMimeType('');
    setNewMimeTypeError('');
    setSuccessMessage('');
  };

  const validateMaxSize = (value: string): string => {
    if (!value) return 'Maximum file size is required.';
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) return 'Must be a positive whole number.';
    if (num > 100) return 'Cannot exceed 100 MB.';
    return '';
  };

  const handleMaxSizeChange = (value: string) => {
    setMaxSizeInput(value);
    setMaxSizeError(validateMaxSize(value));
    setSuccessMessage('');
  };

  const handleSave = async () => {
    if (!config) return;

    const sizeValidation = validateMaxSize(maxSizeInput);
    if (sizeValidation) {
      setMaxSizeError(sizeValidation);
      return;
    }

    if (config.allowedMimeTypes.length === 0) {
      setError('At least one MIME type must be configured.');
      return;
    }

    const updatedConfig: AttachmentConfig = {
      allowedMimeTypes: config.allowedMimeTypes,
      maxFileSizeMb: Number.parseInt(maxSizeInput, 10),
    };

    try {
      setSaving(true);
      setError('');
      const saved = await updateAttachmentConfig(updatedConfig);
      setConfig(saved);
      setMaxSizeInput(String(saved.maxFileSizeMb));
      setSuccessMessage('Attachment configuration saved successfully.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const hasErrors = maxSizeError !== '' || (config?.allowedMimeTypes.length ?? 1) === 0;

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Attachment Configuration"
        subtitle="Define allowed file types and maximum upload size."
        breadcrumbs={[{ label: 'Admin', href: ROUTES.ADMIN }, { label: 'Attachment Config' }]}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Allowed MIME Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 min-h-[48px] p-2 rounded-md border bg-muted/30">
                {config?.allowedMimeTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground self-center">No types configured — uploads will be rejected.</p>
                ) : (
                  config?.allowedMimeTypes.map((type) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/20 gap-1"
                      onClick={() => handleRemoveMimeType(type)}
                      title={`Click to remove ${type}`}
                    >
                      {type}
                      <span aria-hidden="true">×</span>
                    </Badge>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Input
                    id="new-mime-type"
                    placeholder="e.g. image/jpeg"
                    value={newMimeType}
                    onChange={(e) => {
                      setNewMimeType(e.target.value);
                      setNewMimeTypeError('');
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMimeType(); } }}
                    aria-invalid={newMimeTypeError !== ''}
                    aria-describedby={newMimeTypeError ? 'mime-type-error' : undefined}
                  />
                  {newMimeTypeError ? (
                    <p id="mime-type-error" className="text-xs text-destructive">{newMimeTypeError}</p>
                  ) : null}
                </div>
                <Button type="button" variant="outline" onClick={handleAddMimeType}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maximum File Size</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-size">Maximum size (MB)</Label>
                <Input
                  id="max-size"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={maxSizeInput}
                  onChange={(e) => handleMaxSizeChange(e.target.value)}
                  aria-invalid={maxSizeError !== ''}
                  aria-describedby={maxSizeError ? 'max-size-error' : undefined}
                />
                {maxSizeError ? (
                  <p id="max-size-error" className="text-xs text-destructive">{maxSizeError}</p>
                ) : null}
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={() => { void handleSave(); }}
                disabled={saving || hasErrors}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}
