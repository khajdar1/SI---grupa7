'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

import { ROUTES } from '@/constants';
import { PageHeader, PageLayout } from '@/components/shared';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { api } from '@/lib/api';
import { translateCategoryName, translateInterventionStatus, translatePriority, useI18n } from '@/lib/i18n';

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

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const PAGE_SIZE = 10;
const INITIAL_PAGINATION: HistoryPagination = {
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

export default function HistoryPage() {
  const { language, t } = useI18n();
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
  const [pendingBulkAction, setPendingBulkAction] = useState<'ARCHIVE' | 'DEARCHIVE'>('ARCHIVE');

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
      setMessage(language === 'bs' ? 'Historija intervencija je uspješno učitana.' : response.data.message);
      setPagination(response.data.pagination);
    } catch {
      setItems([]);
      setPagination(INITIAL_PAGINATION);
      setMessage(language === 'bs' ? 'Historiju intervencija nije moguće učitati. Provjerite filtere i pokušajte ponovo.' : 'Intervention history could not be loaded. Check the filters and try again.');
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


  const selectedItems = items.filter((item) => selectedIds.includes(Number(item.id)));
  const selectedHasArchived = selectedItems.some((item) => item.archived);
  const selectedHasActive = selectedItems.some((item) => !item.archived);
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

  const openBulkConfirm = (action: 'ARCHIVE' | 'DEARCHIVE') => {
    setPendingBulkAction(action);
    setIsConfirmOpen(true);
  };

  const executeBulkArchiveAction = async () => {
    setIsArchiving(true);
    try {
      await api.post('/api/v1/interventions/bulk-actions', {
        action: pendingBulkAction,
        interventionIds: selectedIds,
        payload: {},
      });
      setMessage(
        `${selectedIds.length} intervention${selectedIds.length !== 1 ? 's' : ''} ${
          pendingBulkAction === 'ARCHIVE' ? 'archived' : 'dearchived'
        } successfully.`,
      );
      clearSelection();
      await loadHistory(page);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message || 'Failed to update archive state. Please try again.',
      );
    } finally {
      setIsArchiving(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={language === 'bs' ? 'Historija intervencija' : 'Intervention History'}
        subtitle={language === 'bs' ? 'Pregledajte prethodno završene ili arhivirane intervencije po lokaciji i tipu kvara.' : 'Review previous completed or archived interventions by location and fault type.'}
        breadcrumbs={[{ label: t('nav.dashboard'), href: ROUTES.DASHBOARD }, { label: t('nav.history') }]}
      />

      {/* ── Filters ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            {t('interventionDetail.location')}
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder={language === 'bs' ? 'npr. Ilidža' : 'e.g. Ilidza'}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            {language === 'bs' ? 'Tip kvara' : 'Fault Type'}
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder={language === 'bs' ? 'npr. Vodovodni kvar ili 2' : 'e.g. Plumbing or 2'}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isLoading ? (language === 'bs' ? 'Pretraga...' : 'Searching...') : (language === 'bs' ? 'Filtriraj historiju' : 'Filter History')}
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
              title={showArchived ? (language === 'bs' ? 'Sakrij arhivirane intervencije' : 'Hide archived interventions') : (language === 'bs' ? 'Prikaži arhivirane intervencije' : 'Show archived interventions')}
            >
              {showArchived ? (language === 'bs' ? 'Sakrij arhivirane' : 'Hide archived') : (language === 'bs' ? 'Prikaži arhivirane' : 'Show archived')}
            </button>
          </div>
        </form>

        {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
      </section>

      {/* ── Bulk action toolbar (visible only when rows are selected) ── */}
      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
          <span className="font-medium text-slate-900">
            {language === 'bs' ? `${selectedIds.length} intervencija odabrano` : `${selectedIds.length} intervention${selectedIds.length !== 1 ? 's' : ''} selected`}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => openBulkConfirm('ARCHIVE')}
              disabled={selectedHasArchived}
              title={selectedHasArchived ? (language === 'bs' ? 'Već arhivirane intervencije ne mogu se ponovo arhivirati.' : 'Already archived interventions cannot be archived again.') : (language === 'bs' ? 'Arhiviraj odabrane intervencije' : 'Archive selected interventions')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {language === 'bs' ? 'Arhiviraj' : 'Archive'}
            </button>
            <button
              type="button"
              onClick={() => openBulkConfirm('DEARCHIVE')}
              disabled={selectedHasActive}
              title={selectedHasActive ? (language === 'bs' ? 'Samo arhivirane intervencije mogu se dearhivirati.' : 'Only archived interventions can be dearchived.') : (language === 'bs' ? 'Dearhiviraj odabrane intervencije' : 'Dearchive selected interventions')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {language === 'bs' ? 'Dearhiviraj' : 'Dearchive'}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {language === 'bs' ? 'Očisti' : 'Clear'}
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[980px] w-full border-collapse text-left text-sm">
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
              <th className="px-4 py-3">{language === 'bs' ? 'Datum' : 'Date'}</th>
              <th className="px-4 py-3">{t('interventionDetail.status')}</th>
              <th className="px-4 py-3">{t('interventionDetail.priority')}</th>
              <th className="px-4 py-3">{t('interventionDetail.location')}</th>
              <th className="px-4 py-3">{language === 'bs' ? 'Tip kvara' : 'Fault Type'}</th>
              <th className="px-4 py-3">{language === 'bs' ? 'Serviser' : 'Technician'}</th>
              <th className="px-4 py-3">{t('interventionDetail.description')}</th>
              <th className="px-4 py-3">{t('nav.reports')}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                  {language === 'bs' ? 'Nema podataka za prikaz.' : 'No data to display.'}
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
                    <td className="px-4 py-3">{new Date(item.date).toLocaleDateString(language === 'bs' ? 'bs-BA' : 'en-US')}</td>
                    <td className="px-4 py-3">{translateInterventionStatus(language, item.status)}</td>
                    <td className="px-4 py-3">{translatePriority(language, item.priority)}</td>
                    <td className="max-w-64 px-4 py-3">
                      <span className="block truncate" title={item.location}>
                        {item.location}
                      </span>
                    </td>
                    <td className="px-4 py-3">{translateCategoryName(language, item.categoryName)}</td>
                    <td className="px-4 py-3">{item.servicer}</td>
                    <td className="px-4 py-3">{item.summary}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`${ROUTES.REPORTS}?interventionId=${encodeURIComponent(item.id)}`}
                        className="font-medium text-slate-900 underline underline-offset-4"
                      >
                        {language === 'bs' ? 'Otvori' : 'Open'}
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
            {language === 'bs' ? `Stranica ${pagination.page} od ${pagination.totalPages} (${pagination.total} ukupno)` : `Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total)`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isLoading || page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-50"
            >
              {language === 'bs' ? 'Prethodna' : 'Previous'}
            </button>
            <button
              type="button"
              disabled={isLoading || page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-50"
            >
              {language === 'bs' ? 'Sljedeća' : 'Next'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Archive confirm dialog ── */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => { void executeBulkArchiveAction(); }}
        title={pendingBulkAction === 'ARCHIVE' ? (language === 'bs' ? 'Arhiviraj intervencije' : 'Archive interventions') : (language === 'bs' ? 'Dearhiviraj intervencije' : 'Dearchive interventions')}
        description={
          pendingBulkAction === 'ARCHIVE'
            ? (language === 'bs' ? `Arhivirati ${selectedIds.length} odabranih intervencija? Arhivirane intervencije se neće prikazivati osim ako je uključen prikaz arhiviranih.` : `Archive ${selectedIds.length} selected intervention${selectedIds.length !== 1 ? 's' : ''}? Archived interventions will no longer appear in the history list unless archived items are shown.`)
            : (language === 'bs' ? `Dearhivirati ${selectedIds.length} odabranih intervencija? Ponovo će se prikazivati u regularnoj historiji.` : `Dearchive ${selectedIds.length} selected intervention${selectedIds.length !== 1 ? 's' : ''}? They will appear in the regular history list again.`)
        }
        confirmLabel={pendingBulkAction === 'ARCHIVE' ? (language === 'bs' ? 'Arhiviraj' : 'Archive') : (language === 'bs' ? 'Dearhiviraj' : 'Dearchive')}
        cancelLabel={t('tickets.cancel')}
        variant="default"
        isLoading={isArchiving}
      />
    </PageLayout>
  );
}
