'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

import { ROUTES } from '@/constants';
import { PageHeader, PageLayout } from '@/components/shared';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { api } from '@/lib/api';

type InterventionHistoryItem = {
  id: string;
  date: string;
  status: string;
  priority: string;
  location: string;
  categoryId: number;
  categoryName: string;
  summary: string;
  servicer: string;
  archived?: boolean;
};

type HistoryPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type InterventionHistoryResponse = {
  message: string;
  data: InterventionHistoryItem[];
  pagination: HistoryPagination;
};

const PAGE_SIZE = 10;
const INITIAL_PAGINATION: HistoryPagination = {
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

export default function HistoryPage() {
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState<InterventionHistoryItem[]>([]);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<HistoryPagination>(INITIAL_PAGINATION);
  const [isLoading, setIsLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  async function loadHistory(nextPage = page) {
    setIsLoading(true);
    setMessage('');

    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(PAGE_SIZE),
        showArchived: String(showArchived),
      });

      if (location.trim()) {
        params.set('location', location.trim());
      }

      if (category.trim()) {
        const normalizedCategory = category.trim();
        if (/^\d+$/.test(normalizedCategory)) {
          params.set('categoryId', normalizedCategory);
        } else {
          params.set('category', normalizedCategory);
        }
      }

      const response = await api.get<InterventionHistoryResponse>(
        `/api/v1/interventions/history?${params.toString()}`,
      );

      setItems(response.data.data);
      setMessage(response.data.message);
      setPagination(response.data.pagination);
    } catch {
      setItems([]);
      setPagination(INITIAL_PAGINATION);
      setMessage('Intervention history could not be loaded. Check the filters and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (page === 1) {
      await loadHistory(1);
      return;
    }

    setPage(1);
  }

  useEffect(() => {
    void loadHistory(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, showArchived]);


  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((row) => Number(row.id)));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const executeArchive = async () => {
    setIsArchiving(true);
    try {
      await api.post('/api/v1/interventions/bulk-actions', {
        action: 'ARCHIVE',
        interventionIds: selectedIds,
        payload: {},
      });
      setMessage(`${selectedIds.length} intervention${selectedIds.length !== 1 ? 's' : ''} archived successfully.`);
      clearSelection();
      await loadHistory(page);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message || 'Failed to archive interventions. Please try again.',
      );
    } finally {
      setIsArchiving(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Intervention History"
        subtitle="Review previous completed or archived interventions by location and fault type."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'History' }]}
      />

      {/* ── Filters ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Location
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g. Ilidza"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Fault Type
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="e.g. Plumbing or 2"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isLoading ? 'Searching...' : 'Filter History'}
            </button>

            {/* ── Show archived toggle ── */}
            <button
              type="button"
              onClick={() => {
                setShowArchived((prev) => !prev);
                setPage(1);
                clearSelection();
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                showArchived
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title={showArchived ? 'Hide archived interventions' : 'Show archived interventions'}
            >
              {showArchived ? 'Hide archived' : 'Show archived'}
            </button>
          </div>
        </form>

        {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
      </section>

      {/* ── Bulk action toolbar (visible only when rows are selected) ── */}
      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
          <span className="font-medium text-slate-900">
            {selectedIds.length} intervention{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Archive
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all interventions"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-slate-900"
                />
              </th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Fault Type</th>
              <th className="px-4 py-3">Technician</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Report</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                  No data to display.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const numericId = Number(item.id);
                const isChecked = selectedIds.includes(numericId);

                return (
                  <tr
                    key={item.id}
                    className={`border-t border-slate-100 transition-colors ${
                      isChecked ? 'bg-slate-50' : 'hover:bg-slate-50/50'
                    } ${item.archived ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select intervention #${item.id}`}
                        checked={isChecked}
                        onChange={() => toggleSelectRow(numericId)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-slate-900"
                      />
                    </td>
                    <td className="px-4 py-3">{new Date(item.date).toLocaleDateString('en-US')}</td>
                    <td className="px-4 py-3">{item.status}</td>
                    <td className="px-4 py-3">{item.priority}</td>
                    <td className="px-4 py-3">{item.location}</td>
                    <td className="px-4 py-3">{item.categoryName}</td>
                    <td className="px-4 py-3">{item.servicer}</td>
                    <td className="px-4 py-3">{item.summary}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`${ROUTES.REPORTS}?interventionId=${encodeURIComponent(item.id)}`}
                        className="font-medium text-slate-900 underline underline-offset-4"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* ── Pagination ── */}
        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isLoading || page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={isLoading || page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* ── Archive confirm dialog ── */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => { void executeArchive(); }}
        title="Archive interventions"
        description={`Archive ${selectedIds.length} selected intervention${selectedIds.length !== 1 ? 's' : ''}? Archived interventions will no longer appear in the history list but will remain in the database.`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        variant="default"
        isLoading={isArchiving}
      />
    </PageLayout>
  );
}