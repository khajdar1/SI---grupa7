'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { EmptyState, PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/constants';
import { clearFieldError, validateRequiredSelection } from '@/lib/form-validation';
import type { Category } from '@/models/Category';
import { getCategories } from '@/services/categories.service';

export default function FaultReportsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const categoryList = await getCategories();
      setCategories(categoryList.filter((category: Category) => category.active));
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  const hasCategories = useMemo(() => categories.length > 0, [categories]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const categoryError = validateRequiredSelection(
      selectedCategory,
      'Please select a category before continuing.',
    );

    if (categoryError) {
      setFieldErrors({ category: categoryError });
      return;
    }

    setFieldErrors({});
  };

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Fault Reports"
        subtitle="Start fault intake by selecting a malfunction category."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Fault Reports' }]}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : error ? (
            <EmptyState
              title="Categories unavailable"
              description={error}
              action={{ label: 'Retry', onClick: () => void fetchCategories() }}
            />
          ) : (
            <>
              {!hasCategories ? (
                <EmptyState
                  title="No active categories"
                  description="Fault intake cannot proceed until at least one category is active."
                />
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="fault-category">Category of malfunction</Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) => {
                        setSelectedCategory(value ?? '');
                        setFieldErrors((prev) => clearFieldError(prev, 'category'));
                      }}
                    >
                      <SelectTrigger
                        id="fault-category"
                        className="w-full sm:max-w-md"
                        aria-invalid={Boolean(fieldErrors.category)}
                        aria-describedby={fieldErrors.category ? 'fault-report-category-error' : undefined}
                      >
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.category ? (
                      <p id="fault-report-category-error" className="text-xs text-destructive">
                        {fieldErrors.category}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={!selectedCategory}>
                      Submit Report (Stub)
                    </Button>
                    <Button asChild type="button" variant="outline">
                      <Link href={ROUTES.DASHBOARD}>Back to Dashboard</Link>
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
