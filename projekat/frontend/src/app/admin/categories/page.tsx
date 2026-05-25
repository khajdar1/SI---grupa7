'use client';
export const runtime = 'edge';

import { useEffect, useMemo, useState } from 'react';

import { AccessDenied, ConfirmDialog, DataTable, PageHeader, PageLayout } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES, UI } from '@/constants';
import {
  clearFieldError,
  getApiFieldErrors,
  translateValidationMessage,
  validateRequired,
  validateSafeText,
} from '@/lib/form-validation';
import { translateCategoryName, useI18n, type LanguageCode } from '@/lib/i18n';
import type { Category } from '@/models/Category';
import {
  createCategory,
  getCategories,
  updateCategory,
  updateCategoryStatus,
} from '@/services/categories.service';

const NEW_CATEGORY_ID = 0;

function translateCategoryDescription(language: LanguageCode, description: string | null | undefined) {
  const value = description ?? '';
  if (language !== 'bs') {
    return value;
  }

  const descriptions: Record<string, string> = {
    'Electrical wiring, lighting, and power supply issues.': 'Kvarovi na elektroinstalacijama, osvjetljenju i napajanju.',
    'Regular or minor operational requests that are not urgent faults.': 'Redovni ili manji operativni zahtjevi koji nisu hitni kvarovi.',
    'Water supply and drainage installation issues.': 'Kvarovi na vodovodnim i kanalizacionim instalacijama.',
    'Local network access and connectivity issues.': 'Problemi sa lokalnom mrežom, pristupom i povezivanjem.',
  };

  return descriptions[value] ?? value;
}

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
      ...Object.values(payload.resource_access ?? {}).flatMap((a) => a.roles ?? []),
    ].map((r) => r.toLowerCase());
    return roles.includes('admin') || roles.includes('administrator');
  } catch { return false; }
}

export default function AdminCategoriesPage() {
  const { language } = useI18n();
  const [authorized, setAuthorized] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ id: NEW_CATEGORY_ID, name: '', description: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pendingStatusCategory, setPendingStatusCategory] = useState<Category | null>(null);

  const activeCategoriesCount = useMemo(
    () => categories.filter((category) => category.active).length,
    [categories],
  );

  const visibleCategories = useMemo(() => {
    const seen = new Set<string>();
    return categories.filter((category) => {
      const displayName = translateCategoryName(language, category.name);
      if (seen.has(displayName)) return false;
      seen.add(displayName);
      return true;
    });
  }, [categories, language]);

  const fetchCategories = async () => {
    try {
      const categoryList = await getCategories();
      setCategories(categoryList);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : translateValidationMessage('Failed to load categories.', language));
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
      void fetchCategories();
    } else {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    const nextFieldErrors: Record<string, string> = {};
    const nameError = validateRequired(formData.name, 'Category name is required.');
    const descriptionError = validateSafeText(formData.description, {
      maxLength: 500,
      maxLengthMessage: 'Description must be at most 500 characters.',
    });

    if (nameError) {
      nextFieldErrors.name = nameError;
    }

    if (descriptionError) {
      nextFieldErrors.description = descriptionError;
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setFormError(translateValidationMessage('Please correct the highlighted fields.', language));
      return;
    }

    setFieldErrors({});

    try {
      if (isEditing) {
        await updateCategory(formData.id, {
          name: formData.name,
          description: formData.description,
        });
      } else {
        await createCategory({
          name: formData.name,
          description: formData.description,
        });
      }

      setFormData({ id: NEW_CATEGORY_ID, name: '', description: '' });
      setIsEditing(false);
      await fetchCategories();
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

      setFormError(requestError instanceof Error ? requestError.message : translateValidationMessage('An error occurred.', language));
    }
  };

  const handleEdit = (category: Category) => {
    setIsEditing(true);
    setFormData({
      id: category.id,
      name: category.name,
      description: category.description ?? '',
    });
    setFormError('');
    setFieldErrors({});
  };

  const handleToggleStatus = async () => {
    if (!pendingStatusCategory) {
      return;
    }

    try {
      await updateCategoryStatus(pendingStatusCategory.id, !pendingStatusCategory.active);
      await fetchCategories();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : translateValidationMessage('Failed to update status.', language));
    } finally {
      setPendingStatusCategory(null);
    }
  };

  const handleCancel = () => {
    setFormData({ id: NEW_CATEGORY_ID, name: '', description: '' });
    setIsEditing(false);
    setFormError('');
    setFieldErrors({});
  };

  if (!authorized) {
    return <AccessDenied reason={isGuest ? 'unauthenticated' : 'unauthorized'} requiredRole="Admin" />;
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={language === 'bs' ? 'Upravljanje kategorijama' : 'Manage Categories'}
        subtitle={
          language === 'bs'
            ? 'Kreirajte, uredite i aktivirajte/deaktivirajte kategorije prijava kvarova.'
            : 'Create, edit, and activate/deactivate fault report categories.'
        }
        breadcrumbs={[{ label: 'Admin', href: ROUTES.ADMIN }, { label: language === 'bs' ? 'Kategorije' : 'Categories' }]}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!loading && activeCategoriesCount === 0 ? (
        <p className="text-sm text-amber-600">
          {language === 'bs'
            ? 'Nema aktivnih kategorija. Korisnici neće moći slati redovne prijave kvarova.'
            : 'No active categories. Users will not be able to submit regular fault reports.'}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? (language === 'bs' ? 'Uredi kategoriju' : 'Edit Category') : (language === 'bs' ? 'Nova kategorija' : 'New Category')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

              <div className="space-y-2">
                <Label htmlFor="category-name">{language === 'bs' ? 'Naziv (jedinstven)' : 'Name (unique)'}</Label>
                <Input
                  id="category-name"
                  required
                  value={formData.name}
                  onChange={(event) => {
                    setFormData((previous) => ({ ...previous, name: event.target.value }));
                    setFieldErrors((previous) => clearFieldError(previous, 'name'));
                  }}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'category-name-error' : undefined}
                />
                {fieldErrors.name ? (
                  <p id="category-name-error" className="text-xs text-destructive">
                    {fieldErrors.name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-description">{language === 'bs' ? 'Opis' : 'Description'}</Label>
                <Textarea
                  id="category-description"
                  value={formData.description}
                  onChange={(event) => {
                    setFormData((previous) => ({ ...previous, description: event.target.value }));
                    setFieldErrors((previous) => clearFieldError(previous, 'description'));
                  }}
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={fieldErrors.description ? 'category-description-error' : undefined}
                />
                {fieldErrors.description ? (
                  <p id="category-description-error" className="text-xs text-destructive">
                    {fieldErrors.description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit">{isEditing ? (language === 'bs' ? 'Ažuriraj' : 'Update') : (language === 'bs' ? 'Kreiraj' : 'Create')}</Button>
                {isEditing ? (
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    {language === 'bs' ? 'Odustani' : 'Cancel'}
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'bs' ? 'Sve kategorije' : 'All Categories'}</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable<Category>
              columns={[
                {
                  key: 'name',
                  header: language === 'bs' ? 'Naziv' : 'Name',
                  render: (value) => translateCategoryName(language, String(value ?? '')),
                },
                {
                  key: 'description',
                  header: language === 'bs' ? 'Opis' : 'Description',
                  render: (value) => (value ? translateCategoryDescription(language, String(value)) : '-'),
                },
                {
                  key: 'active',
                  header: 'Status',
                  width: UI.TABLE_COLUMN_WIDTHS.CATEGORY_STATUS,
                  render: (value) =>
                    value ? (
                      <Badge variant="secondary">{language === 'bs' ? 'Aktivna' : 'Active'}</Badge>
                    ) : (
                      <Badge variant="destructive">{language === 'bs' ? 'Neaktivna' : 'Inactive'}</Badge>
                    ),
                },
                {
                  key: 'createdByName',
                  header: language === 'bs' ? 'Kreirao' : 'Created By',
                  render: (value) => (value ? String(value) : language === 'bs' ? 'Sistem' : 'System'),
                },
                {
                  key: 'updatedByName',
                  header: language === 'bs' ? 'Ažurirao' : 'Updated By',
                  render: (value, row) => (value ? String(value) : row.createdByName || (language === 'bs' ? 'Sistem' : 'System')),
                },
                {
                  key: 'createdAt',
                  header: language === 'bs' ? 'Kreirano' : 'Created',
                  width: UI.TABLE_COLUMN_WIDTHS.CATEGORY_CREATED,
                  render: (value) => new Date(String(value)).toLocaleDateString(),
                },
                {
                  key: 'id',
                  header: language === 'bs' ? 'Akcije' : 'Actions',
                  width: UI.TABLE_COLUMN_WIDTHS.CATEGORY_ACTIONS,
                  render: (_, row) => (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(row)}
                        disabled={!row.active}
                      >
                        {language === 'bs' ? 'Uredi' : 'Edit'}
                      </Button>
                      <Button
                        type="button"
                        variant={row.active ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => setPendingStatusCategory(row)}
                      >
                        {row.active ? (language === 'bs' ? 'Deaktiviraj' : 'Deactivate') : (language === 'bs' ? 'Reaktiviraj' : 'Reactivate')}
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={visibleCategories}
              keyExtractor={(row) => String(row.id)}
              isLoading={loading}
              error={error || null}
              onRetry={fetchCategories}
              emptyTitle={language === 'bs' ? 'Nema pronađenih kategorija' : 'No categories found'}
              emptyDescription={language === 'bs' ? 'Kreirajte prvu kategoriju da omogućite usmjeravanje prijava kvarova.' : 'Create the first category to enable fault intake routing.'}
            />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={pendingStatusCategory !== null}
        onClose={() => setPendingStatusCategory(null)}
        onConfirm={handleToggleStatus}
        title={pendingStatusCategory?.active ? (language === 'bs' ? 'Deaktivirati kategoriju?' : 'Deactivate category?') : (language === 'bs' ? 'Reaktivirati kategoriju?' : 'Reactivate category?')}
        description={
          pendingStatusCategory?.active
            ? language === 'bs' ? 'Ova kategorija više neće biti dostupna u toku prijave.' : 'This category will no longer be available in the intake flow.'
            : language === 'bs' ? 'Ova kategorija će ponovo biti dostupna u toku prijave.' : 'This category will become available in the intake flow again.'
        }
        confirmLabel={pendingStatusCategory?.active ? (language === 'bs' ? 'Deaktiviraj' : 'Deactivate') : (language === 'bs' ? 'Reaktiviraj' : 'Reactivate')}
        variant={pendingStatusCategory?.active ? 'warning' : 'default'}
      />
    </PageLayout>
  );
}
