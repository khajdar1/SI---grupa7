'use client';
export const runtime = 'edge';

import { useEffect, useMemo, useState } from 'react';

import { ROUTES, UI } from '@/constants';
import {
  DataTable,
  FilterBar,
  PageHeader,
  PageLayout,
  PriorityBadge,
  InterventionStatusBadge,
} from '@/components/shared';
import type { Category } from '@/models/Category';
import {
  getInterventions,
  type InterventionListItem,
} from '@/services/interventions.service';
import { getCategories } from '@/services/categories.service';
import type { ModuleShellResponse } from '@/services/types';

const ALL_CATEGORY = 'ALL';

export default function InterventionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [rows, setRows] = useState<InterventionListItem[]>([]);
  const [moduleInfo, setModuleInfo] = useState<ModuleShellResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [categoryList, interventionsResult] = await Promise.all([
        getCategories(),
        getInterventions(),
      ]);

      setCategories(categoryList);
      setRows(interventionsResult.items);
      setModuleInfo(interventionsResult.moduleInfo);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load interventions data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredRows = useMemo(() => {
    if (selectedCategory === ALL_CATEGORY) {
      return rows;
    }

    const category = categories.find((item) => String(item.id) === selectedCategory);
    if (!category) {
      return [];
    }

    return rows.filter((row) => row.categoryName === category.name);
  }, [categories, rows, selectedCategory]);

  const filterOptions = [
    { value: ALL_CATEGORY, label: 'All categories' },
    ...categories.map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
  ];

  const emptyDescription = moduleInfo
    ? `Backend shell endpoint(s): ${moduleInfo.endpoints.join(', ')}`
    : 'No intervention records available yet.';

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Interventions"
        subtitle="Prioritized list for operational follow-up and ownership tracking."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Interventions' }]}
      />

      <FilterBar
        filters={[
          {
            key: 'category',
            label: 'Category',
            options: filterOptions,
            value: selectedCategory,
            onChange: setSelectedCategory,
          },
        ]}
        isFiltered={selectedCategory !== ALL_CATEGORY}
        onClear={() => setSelectedCategory(ALL_CATEGORY)}
      />

      <DataTable<InterventionListItem>
        columns={[
          { key: 'id', header: 'ID', width: UI.TABLE_COLUMN_WIDTHS.INTERVENTIONS_ID },
          { key: 'title', header: 'Title' },
          { key: 'categoryName', header: 'Category' },
          {
            key: 'priority',
            header: 'Priority',
            width: UI.TABLE_COLUMN_WIDTHS.INTERVENTIONS_PRIORITY,
            render: (value) => <PriorityBadge priority={value as InterventionListItem['priority']} />,
          },
          {
            key: 'status',
            header: 'Status',
            width: UI.TABLE_COLUMN_WIDTHS.INTERVENTIONS_STATUS,
            render: (value) => <InterventionStatusBadge status={value as InterventionListItem['status']} />,
          },
          { key: 'owner', header: 'Owner', width: UI.TABLE_COLUMN_WIDTHS.INTERVENTIONS_OWNER },
        ]}
        data={filteredRows}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={loadData}
        emptyTitle="No interventions in this category"
        emptyDescription={emptyDescription}
      />
    </PageLayout>
  );
}
