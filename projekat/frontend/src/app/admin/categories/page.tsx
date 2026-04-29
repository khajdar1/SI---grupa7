'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';

import { ROUTES, UI } from '@/constants';
import { ConfirmDialog, DataTable, PageHeader, PageLayout } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

  const [pendingStatusCategory, setPendingStatusCategory] = useState<Category | null>(null);

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
    } catch (requestError) {
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
  };

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Manage Categories"
        subtitle="Create, edit, and activate/deactivate fault report categories."
        breadcrumbs={[{ label: 'Admin', href: ROUTES.ADMIN }, { label: 'Categories' }]}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Category' : 'New Category'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

              <div className="space-y-2">
                <Label htmlFor="category-name">Name (unique)</Label>
                <Input
                  id="category-name"
                  required
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((previous) => ({ ...previous, name: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-description">Description</Label>
                <Textarea
                  id="category-description"
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((previous) => ({ ...previous, description: event.target.value }))
                  }
                />
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
