'use client';
export const runtime = 'edge';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { ROUTES } from '@/constants';
import { EmptyState, PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category } from '@/models/Category';
import { getCategories } from '@/services/categories.service';

export default function FaultReportsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState('');
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
            <div className="space-y-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-10 w-full sm:max-w-md" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
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
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="fault-category">Category of malfunction</Label>
                    <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value ?? '')}>
                      <SelectTrigger id="fault-category" className="w-full sm:max-w-md">
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
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={!selectedCategory}>
                      Submit Report (Stub)
                    </Button>
                    <Button asChild type="button" variant="outline">
                      <Link href={ROUTES.DASHBOARD}>Back to Dashboard</Link>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
