'use client';
export const runtime = 'edge';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  X,
} from 'lucide-react';

import { CompanyFormFields } from '@/components/companies/CompanyFormFields';
import { DataTable, PageHeader, PageLayout, StatCard } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES, UI } from '@/constants';
import {
  EMPTY_COMPANY_FORM,
  toCompanyInput,
  validateCompanyForm,
  type CompanyFormData,
} from '@/lib/company-validation';
import { clearFieldError, getApiFieldErrors, type FieldErrors } from '@/lib/form-validation';
import { useI18n } from '@/lib/i18n';
import type { Company, CompanyStatus } from '@/models/Company';
import {
  assignCompanyAdmin,
  createCompany,
  getCompanies,
  updateCompany,
  updateCompanyStatus,
} from '@/services/companies.service';
import { getUsers, type ManagedUser } from '@/services/users.service';

type FormMode = 'create' | 'edit';

const COMPANY_STATUSES: CompanyStatus[] = ['PENDING', 'ACTIVE', 'REJECTED', 'INACTIVE'];
const NO_ADMIN_VALUE = 'NO_ADMIN';

function getStatusLabel(status: CompanyStatus, language: 'en' | 'bs') {
  const labels: Record<CompanyStatus, { en: string; bs: string }> = {
    PENDING: { en: 'Pending', bs: 'Na čekanju' },
    ACTIVE: { en: 'Active', bs: 'Aktivna' },
    REJECTED: { en: 'Rejected', bs: 'Odbijena' },
    INACTIVE: { en: 'Inactive', bs: 'Neaktivna' },
  };
  return labels[status]?.[language] ?? status;
}

const emptyAdminForm = {
  ...EMPTY_COMPANY_FORM,
  id: 0,
  status: 'ACTIVE' as CompanyStatus,
  adminUserId: '',
};

function getTokenRoles(token: string): string[] {
  try {
    const payload = JSON.parse(window.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      realm_access?: { roles?: string[] };
      resource_access?: Record<string, { roles?: string[] }>;
    };

    const realmRoles = payload.realm_access?.roles ?? [];
    const clientRoles = Object.values(payload.resource_access ?? {}).flatMap((access) => access.roles ?? []);
    return [...realmRoles, ...clientRoles].map((role) => role.toLowerCase());
  } catch {
    return [];
  }
}

function hasAdminRole(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const token = window.localStorage.getItem('token');
  if (!token) {
    return false;
  }

  const roles = getTokenRoles(token);
  return roles.includes('admin') || roles.includes('administrator');
}

function getStatusBadgeVariant(status?: CompanyStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'ACTIVE') return 'secondary';
  if (status === 'PENDING') return 'outline';
  if (status === 'REJECTED') return 'destructive';
  return 'default';
}

function toFormData(company: Company): typeof emptyAdminForm {
  return {
    id: company.id,
    name: company.name,
    contact: company.contact ?? '',
    type: company.type ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
    address: company.address ?? '',
    identificationNumber: company.identificationNumber ?? '',
    status: company.status ?? 'ACTIVE',
    adminUserId: company.adminUserId ? String(company.adminUserId) : '',
  };
}

export default function AdminCompaniesPage() {
  const router = useRouter();
  const { language, t } = useI18n();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [formData, setFormData] = useState(emptyAdminForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const stats = useMemo(() => {
    const active = companies.filter((company) => company.status === 'ACTIVE').length;
    const pending = companies.filter((company) => company.status === 'PENDING').length;
    const inactive = companies.filter((company) => company.status === 'INACTIVE').length;

    return [
      { title: language === 'bs' ? 'Kompanije' : 'Companies', value: companies.length },
      { title: language === 'bs' ? 'Aktivne' : 'Active', value: active },
      { title: language === 'bs' ? 'Na čekanju' : 'Pending', value: pending },
      { title: language === 'bs' ? 'Neaktivne' : 'Inactive', value: inactive },
    ];
  }, [companies, language]);

  const companyAdminOptions = useMemo(
    () => users.filter((user) => user.active),
    [users],
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [companyList, userList] = await Promise.all([getCompanies(), getUsers()]);
      setCompanies(companyList);
      setUsers(userList);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'bs' ? 'Učitavanje kompanija nije uspjelo.' : 'Failed to load companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const canUseAdmin = hasAdminRole();
    setAuthorized(canUseAdmin);

    if (canUseAdmin) {
      void loadData();
    } else {
      window.sessionStorage.setItem('authRedirectMessage', language === 'bs' ? 'Nemate dozvolu za upravljanje kompanijama.' : 'You do not have permission to manage companies.');
      router.replace(`${ROUTES.DASHBOARD}?unauthorized=1`);
      setLoading(false);
    }
    setAuthChecked(true);
  }, [router]);

  const resetForm = () => {
    setFormMode('create');
    setFormData(emptyAdminForm);
    setFieldErrors({});
    setFormError('');
  };

  const handleEdit = (company: Company) => {
    setFormMode('edit');
    setFormData(toFormData(company));
    setFieldErrors({});
    setFormError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      const companyInput = toCompanyInput(formData);
      const adminUserId = formData.adminUserId ? Number(formData.adminUserId) : null;

      if (formMode === 'create') {
        const created = await createCompany({
          ...companyInput,
          status: formData.status,
          adminUserId,
        });
        setSuccessMessage(language === 'bs' ? `Kompanija ${created.name} je kreirana.` : `Company ${created.name} created.`);
      } else {
        await updateCompany(formData.id, companyInput);
        await updateCompanyStatus(formData.id, formData.status);
        await assignCompanyAdmin(formData.id, adminUserId);
        setSuccessMessage(language === 'bs' ? 'Kompanija je ažurirana.' : 'Company updated.');
      }

      resetForm();
      await loadData();
    } catch (requestError: unknown) {
      const serviceDetails =
        typeof requestError === 'object' && requestError !== null
          ? (requestError as { details?: unknown }).details
          : undefined;
      const backendFieldErrors = getApiFieldErrors(
        serviceDetails ? { response: (serviceDetails as { response?: unknown }).response } : requestError,
      );

      setFieldErrors(backendFieldErrors);
      setFormError(requestError instanceof Error ? requestError.message : language === 'bs' ? 'Spremanje kompanije nije uspjelo.' : 'Company save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked || !authorized) {
    return null;
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={language === 'bs' ? 'Kompanije' : 'Companies'}
        subtitle={
          language === 'bs'
            ? 'Odobravanje registracija, profili kompanija i vlasništvo administratorskih računa.'
            : 'Registration approvals, company profiles, and company admin ownership.'
        }
        breadcrumbs={[{ label: t('nav.dashboard'), href: ROUTES.DASHBOARD }, { label: 'Admin', href: ROUTES.ADMIN }, { label: language === 'bs' ? 'Kompanije' : 'Companies' }]}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} isLoading={loading} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>{formMode === 'create' ? (language === 'bs' ? 'Nova kompanija' : 'New Company') : (language === 'bs' ? 'Uredi kompaniju' : 'Edit Company')}</CardTitle>
            <CardDescription>{formMode === 'create' ? (language === 'bs' ? 'Kreirajte aktivnu kompaniju ili kompaniju na čekanju.' : 'Create an active or pending company.') : formData.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

              <CompanyFormFields
                formData={formData}
                setFormData={setFormData}
                fieldErrors={fieldErrors}
                setFieldErrors={setFieldErrors}
                disabled={saving}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => {
                      setFormData((previous) => ({ ...previous, status: value as CompanyStatus }));
                      setFieldErrors((previous) => clearFieldError(previous, 'status'));
                    }}
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue>
                        {getStatusLabel(formData.status as CompanyStatus, language)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {getStatusLabel(status, language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyAdmin">{language === 'bs' ? 'Administrator kompanije' : 'Company admin'}</Label>
                  <Select
                    value={formData.adminUserId || NO_ADMIN_VALUE}
                    onValueChange={(value) => {
                      setFormData((previous) => ({
                        ...previous,
                        adminUserId: value === NO_ADMIN_VALUE ? '' : value ?? '',
                      }));
                      setFieldErrors((previous) => clearFieldError(previous, 'adminUserId'));
                    }}
                  >
                    <SelectTrigger id="companyAdmin" className="w-full">
                      <SelectValue>
                        {formData.adminUserId
                          ? (() => {
                              const u = companyAdminOptions.find((user) => String(user.id) === formData.adminUserId);
                              return u ? `${u.firstName} ${u.lastName} (@${u.username})` : (language === 'bs' ? 'Odaberite korisnika' : 'Select user');
                            })()
                          : language === 'bs' ? 'Bez administratora kompanije' : 'No company admin'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_ADMIN_VALUE}>{language === 'bs' ? 'Bez administratora kompanije' : 'No company admin'}</SelectItem>
                      {companyAdminOptions.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {user.firstName} {user.lastName} (@{user.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>
                  {formMode === 'create' ? <Plus className="size-4" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                  {saving ? (language === 'bs' ? 'Spremanje...' : 'Saving...') : formMode === 'create' ? (language === 'bs' ? 'Kreiraj' : 'Create') : (language === 'bs' ? 'Spremi' : 'Save')}
                </Button>
                {formMode === 'edit' ? (
                  <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                    <X className="size-4" aria-hidden="true" />
                    {language === 'bs' ? 'Odustani' : 'Cancel'}
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{language === 'bs' ? 'Registar kompanija' : 'Company Registry'}</CardTitle>
              <CardDescription>{language === 'bs' ? 'Administratorski pregled aktivnih, odbijenih, neaktivnih i kompanija na čekanju.' : 'Admin view across active, pending, rejected, and inactive companies.'}</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className="size-4" aria-hidden="true" />
              {language === 'bs' ? 'Osvježi' : 'Refresh'}
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable<Company>
              columns={[
                {
                  key: 'name',
                  header: language === 'bs' ? 'Kompanija' : 'Company',
                  render: (_, row) => (
                    <div className="min-w-52">
                      <p className="font-medium text-foreground">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.email || row.contact || '-'}</p>
                      <p className="text-xs text-muted-foreground">{row.identificationNumber || row.type || '-'}</p>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  width: UI.TABLE_COLUMN_WIDTHS.COMPANY_STATUS,
                  render: (value) => {
                    const status = value as CompanyStatus | undefined;
                    return (
                      <Badge variant={getStatusBadgeVariant(status)}>
                        {status ? getStatusLabel(status, language) : language === 'bs' ? 'Nepoznato' : 'Unknown'}
                      </Badge>
                    );
                  },
                },
                {
                  key: 'adminUserId',
                  header: language === 'bs' ? 'Administrator kompanije' : 'Company Admin',
                  width: UI.TABLE_COLUMN_WIDTHS.COMPANY_ADMIN,
                  render: (_, row) =>
                    row.adminUser ? (
                      <div>
                        <p className="text-sm font-medium">{row.adminUser.firstName} {row.adminUser.lastName}</p>
                        <p className="text-xs text-muted-foreground">@{row.adminUser.username}</p>
                      </div>
                    ) : (
                      '-'
                    ),
                },
                {
                  key: 'id',
                  header: language === 'bs' ? 'Akcije' : 'Actions',
                  width: UI.TABLE_COLUMN_WIDTHS.COMPANY_ACTIONS,
                  render: (_, row) => (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(row)}>
                        <Pencil className="size-4" aria-hidden="true" />
                        {language === 'bs' ? 'Uredi' : 'Edit'}
                      </Button>
                      {row.status !== 'ACTIVE' ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={async () => {
                            await updateCompanyStatus(row.id, 'ACTIVE');
                            setSuccessMessage(language === 'bs' ? 'Kompanija je aktivirana.' : 'Company activated.');
                            await loadData();
                          }}
                        >
                          <Building2 className="size-4" aria-hidden="true" />
                          {language === 'bs' ? 'Aktiviraj' : 'Activate'}
                        </Button>
                      ) : null}
                    </div>
                  ),
                },
              ]}
              data={companies}
              keyExtractor={(row) => String(row.id)}
              isLoading={loading}
              error={error || null}
              onRetry={loadData}
              emptyTitle={language === 'bs' ? 'Nema kompanija' : 'No companies'}
              emptyDescription={language === 'bs' ? 'Kreirajte ili odobrite kompaniju za početak.' : 'Create or approve a company to begin.'}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
