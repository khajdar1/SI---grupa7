'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { Building2, RefreshCw, Save, ShieldCheck } from 'lucide-react';

import { CompanyFormFields } from '@/components/companies/CompanyFormFields';
import { PageHeader, PageLayout } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/constants';
import {
  EMPTY_COMPANY_FORM,
  toCompanyInput,
  validateCompanyForm,
  type CompanyFormData,
} from '@/lib/company-validation';
import { getApiFieldErrors, type FieldErrors } from '@/lib/form-validation';
import { useI18n } from '@/lib/i18n';
import type { Company, CompanyStatus } from '@/models/Company';
import { getMyCompany, updateCompany } from '@/services/companies.service';

function getCompanyStatusLabel(status: CompanyStatus, language: 'en' | 'bs') {
  const labels: Record<CompanyStatus, { en: string; bs: string }> = {
    PENDING: { en: 'Pending', bs: 'Na čekanju' },
    ACTIVE: { en: 'Active', bs: 'Aktivna' },
    REJECTED: { en: 'Rejected', bs: 'Odbijena' },
    INACTIVE: { en: 'Inactive', bs: 'Neaktivna' },
  };
  return labels[status]?.[language] ?? status;
}

function getStatusBadgeVariant(status?: CompanyStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'ACTIVE') return 'secondary';
  if (status === 'PENDING') return 'outline';
  if (status === 'REJECTED') return 'destructive';
  return 'default';
}

function toFormData(company: Company): CompanyFormData {
  return {
    name: company.name,
    contact: company.contact ?? '',
    type: company.type ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
    address: company.address ?? '',
    identificationNumber: company.identificationNumber ?? '',
  };
}

export default function CompanyProfilePage() {
  const { language, t } = useI18n();
  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(EMPTY_COMPANY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadCompany = async () => {
    try {
      setLoading(true);
      setError('');
      const loaded = await getMyCompany();
      setCompany(loaded);
      setFormData(toFormData(loaded));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : language === 'bs' ? 'Učitavanje profila kompanije nije uspjelo.' : 'Failed to load company profile.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCompany();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company) {
      return;
    }

    setSaving(true);
    setFormError('');
    setSuccessMessage('');

    const nextErrors = validateCompanyForm(formData);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError(language === 'bs' ? 'Ispravite označena polja.' : 'Please correct the highlighted fields.');
      setSaving(false);
      return;
    }

    try {
      const updated = await updateCompany(company.id, toCompanyInput(formData));
      setCompany(updated);
      setFormData(toFormData(updated));
      setFieldErrors({});
      setSuccessMessage(language === 'bs' ? 'Profil kompanije je ažuriran.' : 'Company profile updated.');
    } catch (requestError: unknown) {
      const serviceDetails =
        typeof requestError === 'object' && requestError !== null
          ? (requestError as { details?: unknown }).details
          : undefined;
      const backendFieldErrors = getApiFieldErrors(
        serviceDetails ? { response: (serviceDetails as { response?: unknown }).response } : requestError,
      );

      setFieldErrors(backendFieldErrors);
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : language === 'bs' ? 'Ažuriranje kompanije nije uspjelo.' : 'Company update failed.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={language === 'bs' ? 'Kompanija' : 'Company'}
        subtitle={
          language === 'bs'
            ? 'Upravljajte profilom dodijeljenim vašem administratorskom računu kompanije.'
            : 'Manage the profile assigned to your company admin account.'
        }
        breadcrumbs={[{ label: t('nav.dashboard'), href: ROUTES.DASHBOARD }, { label: language === 'bs' ? 'Kompanija' : 'Company' }]}
      />

      {error ? (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6 text-sm text-muted-foreground">
            <ShieldCheck className="size-5 text-destructive" aria-hidden="true" />
            <span>{error}</span>
            <Button type="button" variant="outline" size="sm" onClick={loadCompany}>
              <RefreshCw className="size-4" aria-hidden="true" />
              {language === 'bs' ? 'Pokušaj ponovo' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5" aria-hidden="true" />
              {company?.name ?? (language === 'bs' ? 'Profil kompanije' : 'Company profile')}
            </CardTitle>
            <CardDescription>
              {language === 'bs'
                ? 'Administratori kompanije mogu uređivati profilne podatke, ali ne vlasništvo, status ili uloge.'
                : 'Company admins can edit profile data, not ownership, status, or roles.'}
            </CardDescription>
          </div>
          {company?.status ? (
            <Badge variant={getStatusBadgeVariant(company.status)}>
              {getCompanyStatusLabel(company.status, language)}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

            <CompanyFormFields
              formData={formData}
              setFormData={setFormData}
              fieldErrors={fieldErrors}
              setFieldErrors={setFieldErrors}
              disabled={loading || saving || !company}
            />

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading || saving || !company}>
                <Save className="size-4" aria-hidden="true" />
                {saving ? (language === 'bs' ? 'Spremanje...' : 'Saving...') : language === 'bs' ? 'Spremi' : 'Save'}
              </Button>
              <Button type="button" variant="outline" disabled={loading || saving} onClick={loadCompany}>
                <RefreshCw className="size-4" aria-hidden="true" />
                {language === 'bs' ? 'Osvježi' : 'Refresh'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
