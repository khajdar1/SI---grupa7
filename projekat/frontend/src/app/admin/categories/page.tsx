'use client';
export const runtime = 'edge';

import { useEffect, useMemo, useState } from 'react';

import { ConfirmDialog, DataTable, PageHeader, PageLayout } from '@/components/shared';
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
  validateRequired,
  validateSafeText,
} from '@/lib/form-validation';
import type { Category } from '@/models/Category';
import {
  createCategory,
  getCategories,
  updateCategory,
  updateCategoryStatus,
} from '@/services/categories.service';

const NEW_CATEGORY_ID = 0;

export default function AdminCategoriesPage() {
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

  const fetchCategories = async () => {
    try {
      const categoryList = await getCategories();
      setCategories(categoryList);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories();
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
      setFormError('Please correct the highlighted fields.');
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

      setFormError(requestError instanceof Error ? requestError.message : 'An error occurred.');
    }
  };

  const handleEdit = (category: Category) => {
    setIsEditing(true);
    setFormData({
      id: category.id,
      name: category.name,
      description: category.description || '',
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
      setError(requestError instanceof Error ? requestError.message : 'Failed to update status.');
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

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Manage Categories"
        subtitle="Create, edit, and activate/deactivate fault report categories."
        breadcrumbs={[{ label: 'Admin', href: ROUTES.ADMIN }, { label: 'Categories' }]}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!loading && activeCategoriesCount === 0 ? (
        <p className="text-sm text-amber-600">
          No active categories. Users will not be able to submit regular fault reports.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Category' : 'New Category'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

              <div className="space-y-2">
                <Label htmlFor="category-name">Name (unique)</Label>
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
                <Label htmlFor="category-description">Description</Label>
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
                <Button type="submit">{isEditing ? 'Update' : 'Create'}</Button>
                {isEditing ? (
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable<Category>
              columns={[
                { key: 'name', header: 'Name' },
                {
                  key: 'description',
                  header: 'Description',
                  render: (value) => (value ? String(value) : '-'),
                },
                {
                  key: 'active',
                  header: 'Status',
                  width: UI.TABLE_COLUMN_WIDTHS.CATEGORY_STATUS,
                  render: (value) =>
                    value ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    ),
                },
                {
                  key: 'createdByName',
                  header: 'Created By',
                  render: (value) => (value ? String(value) : 'System'),
                },
                {
                  key: 'updatedByName',
                  header: 'Updated By',
                  render: (value, row) => (value ? String(value) : row.createdByName || 'System'),
                },
                {
                  key: 'createdAt',
                  header: 'Created',
                  width: UI.TABLE_COLUMN_WIDTHS.CATEGORY_CREATED,
                  render: (value) => new Date(String(value)).toLocaleDateString(),
                },
                {
                  key: 'id',
                  header: 'Actions',
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
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant={row.active ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => setPendingStatusCategory(row)}
                      >
                        {row.active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={categories}
              keyExtractor={(row) => String(row.id)}
              isLoading={loading}
              error={error || null}
              onRetry={fetchCategories}
              emptyTitle="No categories found"
              emptyDescription="Create the first category to enable fault intake routing."
            />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={pendingStatusCategory !== null}
        onClose={() => setPendingStatusCategory(null)}
        onConfirm={handleToggleStatus}
        title={pendingStatusCategory?.active ? 'Deactivate category?' : 'Reactivate category?'}
        description={
          pendingStatusCategory?.active
            ? 'This category will no longer be available in the intake flow.'
            : 'This category will become available in the intake flow again.'
        }
        confirmLabel={pendingStatusCategory?.active ? 'Deactivate' : 'Reactivate'}
        variant={pendingStatusCategory?.active ? 'warning' : 'default'}
      />
    </PageLayout>
  );
}
