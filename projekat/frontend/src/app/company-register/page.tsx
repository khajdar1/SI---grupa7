'use client';
export const runtime = 'edge';

import { useState } from 'react';
import { Building2, Send } from 'lucide-react';

import { CompanyFormFields } from '@/components/companies/CompanyFormFields';
import { PageHeader, PageLayout } from '@/components/shared';
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
import { translateText, useI18n } from '@/lib/i18n';
import { selfRegisterCompany } from '@/services/companies.service';

export default function CompanyRegisterPage() {
  const { language } = useI18n();
  const [formData, setFormData] = useState<CompanyFormData>(EMPTY_COMPANY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');
    setSuccessMessage('');

    const nextErrors = validateCompanyForm(formData);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError(translateText(language, 'Please correct the highlighted fields.'));
      setSubmitting(false);
      return;
    }

    try {
      const company = await selfRegisterCompany(toCompanyInput(formData));
      setSuccessMessage(
        translateText(language, '{company} has been submitted for admin approval.').replace('{company}', company.name),
      );
      setFormData(EMPTY_COMPANY_FORM);
      setFieldErrors({});
    } catch (requestError: unknown) {
      const serviceDetails =
        typeof requestError === 'object' && requestError !== null
          ? (requestError as { details?: unknown }).details
          : undefined;
      const backendFieldErrors = getApiFieldErrors(
        serviceDetails ? { response: (serviceDetails as { response?: unknown }).response } : requestError,
      );

      setFieldErrors(backendFieldErrors);
      setFormError(translateText(language, requestError instanceof Error ? requestError.message : 'Company registration failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={translateText(language, 'Register Company')}
        subtitle={translateText(language, 'Submit a company profile for admin approval.')}
        breadcrumbs={[{ label: translateText(language, 'Home'), href: ROUTES.HOME }, { label: translateText(language, 'Register Company') }]}
      />

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" aria-hidden="true" />
            {translateText(language, 'Company profile')}
          </CardTitle>
          <CardDescription>{translateText(language, 'Approved companies become available for service workflows.')}</CardDescription>
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
              disabled={submitting}
            />

            <Button type="submit" disabled={submitting}>
              <Send className="size-4" aria-hidden="true" />
              {submitting ? translateText(language, 'Submitting...') : translateText(language, 'Submit for approval')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
