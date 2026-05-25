'use client';

import { useEffect, useState } from 'react';

import { ROUTES } from '@/constants';
import { AccessDenied, PageHeader, PageLayout } from '@/components/shared';
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
import { useI18n } from '@/lib/i18n';

function hasAdminRole(): boolean {
  if (typeof window === 'undefined') return false;
  const token = window.localStorage.getItem('token');
  if (!token) return false;
  try {
    const payload = JSON.parse(window.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      realm_access?: { roles?: string[] };
      resource_access?: Record<string, { roles?: string[] }>;
    };
    const roles = [
      ...(payload.realm_access?.roles ?? []),
      ...Object.values(payload.resource_access ?? {}).flatMap((access) => access.roles ?? []),
    ].map((role) => role.toLowerCase());
    return roles.includes('admin') || roles.includes('administrator');
  } catch {
    return false;
  }
}

export default function AdminAttachmentConfigPage() {
  const { language } = useI18n();
  const [authorized, setAuthorized] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
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
      setError(
        requestError instanceof Error
          ? requestError.message
          : language === 'bs' ? 'Učitavanje konfiguracije nije uspjelo.' : 'Failed to load configuration.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    const canUseAdmin = hasAdminRole();
    setAuthorized(canUseAdmin);
    setIsGuest(!token);
    if (canUseAdmin) {
      void fetchConfig();
    } else {
      setLoading(false);
    }
  }, []);

  const handleRemoveMimeType = (type: string) => {
    if (!config) return;
    setConfig({ ...config, allowedMimeTypes: config.allowedMimeTypes.filter((item) => item !== type) });
    setSuccessMessage('');
  };

  const validateNewMimeType = (value: string): string => {
    if (!value.trim()) return language === 'bs' ? 'MIME tip ne može biti prazan.' : 'MIME type cannot be empty.';
    if (!/^[\w-]+\/[\w.+\-*]+$/.test(value.trim())) {
      return language === 'bs'
        ? 'Neispravan format MIME tipa (npr. image/jpeg).'
        : 'Invalid MIME type format (e.g. image/jpeg).';
    }
    if (config?.allowedMimeTypes.includes(value.trim())) {
      return language === 'bs' ? 'Ovaj MIME tip je već na listi.' : 'This MIME type is already in the list.';
    }
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
    if (!value) return language === 'bs' ? 'Maksimalna veličina datoteke je obavezna.' : 'Maximum file size is required.';
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      return language === 'bs' ? 'Vrijednost mora biti pozitivan cijeli broj.' : 'Must be a positive whole number.';
    }
    if (num > 100) return language === 'bs' ? 'Ne može biti veće od 100 MB.' : 'Cannot exceed 100 MB.';
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
      setError(language === 'bs' ? 'Mora biti konfigurisan barem jedan MIME tip.' : 'At least one MIME type must be configured.');
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
      setSuccessMessage(language === 'bs' ? 'Konfiguracija priloga je uspješno spremljena.' : 'Attachment configuration saved successfully.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : language === 'bs' ? 'Spremanje konfiguracije nije uspjelo.' : 'Failed to save configuration.',
      );
    } finally {
      setSaving(false);
    }
  };

  const hasErrors = maxSizeError !== '' || (config?.allowedMimeTypes.length ?? 1) === 0;

  if (!authorized) {
    return <AccessDenied reason={isGuest ? 'unauthenticated' : 'unauthorized'} requiredRole="Admin" />;
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={language === 'bs' ? 'Konfiguracija priloga' : 'Attachment Configuration'}
        subtitle={
          language === 'bs'
            ? 'Definišite dozvoljene tipove datoteka i maksimalnu veličinu uploada.'
            : 'Define allowed file types and maximum upload size.'
        }
        breadcrumbs={[{ label: 'Admin', href: ROUTES.ADMIN }, { label: language === 'bs' ? 'Konfiguracija priloga' : 'Attachment Config' }]}
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
              <CardTitle>{language === 'bs' ? 'Dozvoljeni MIME tipovi' : 'Allowed MIME Types'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex min-h-[48px] flex-wrap gap-2 rounded-md border bg-muted/30 p-2">
                {config?.allowedMimeTypes.length === 0 ? (
                  <p className="self-center text-sm text-muted-foreground">
                    {language === 'bs'
                      ? 'Nijedan tip nije konfigurisan - uploadi će biti odbijeni.'
                      : 'No types configured - uploads will be rejected.'}
                  </p>
                ) : (
                  config?.allowedMimeTypes.map((type) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="cursor-pointer gap-1 hover:bg-destructive/20"
                      onClick={() => handleRemoveMimeType(type)}
                      title={language === 'bs' ? `Kliknite za uklanjanje ${type}` : `Click to remove ${type}`}
                    >
                      {type}
                      <span aria-hidden="true">x</span>
                    </Badge>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Input
                    id="new-mime-type"
                    placeholder={language === 'bs' ? 'npr. image/jpeg' : 'e.g. image/jpeg'}
                    value={newMimeType}
                    onChange={(event) => {
                      setNewMimeType(event.target.value);
                      setNewMimeTypeError('');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddMimeType();
                      }
                    }}
                    aria-invalid={newMimeTypeError !== ''}
                    aria-describedby={newMimeTypeError ? 'mime-type-error' : undefined}
                  />
                  {newMimeTypeError ? (
                    <p id="mime-type-error" className="text-xs text-destructive">{newMimeTypeError}</p>
                  ) : null}
                </div>
                <Button type="button" variant="outline" onClick={handleAddMimeType}>
                  {language === 'bs' ? 'Dodaj' : 'Add'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === 'bs' ? 'Maksimalna veličina datoteke' : 'Maximum File Size'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-size">{language === 'bs' ? 'Maksimalna veličina (MB)' : 'Maximum size (MB)'}</Label>
                <Input
                  id="max-size"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={maxSizeInput}
                  onChange={(event) => handleMaxSizeChange(event.target.value)}
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
                {saving
                  ? language === 'bs' ? 'Spremanje...' : 'Saving...'
                  : language === 'bs' ? 'Spremi konfiguraciju' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}
