'use client';
export const runtime = 'edge';

import { useCallback, useEffect, useState } from 'react';
import { BarChart2, Box, Package, RefreshCw, TrendingUp } from 'lucide-react';

import { AccessDenied, PageHeader, PageLayout, StatCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { API_ENDPOINTS, ROUTES } from '@/constants';
import { translateText, useI18n } from '@/lib/i18n';
import { hasSessionRole } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  getMaterialsReport,
  type CompanyMaterialUsage,
  type MaterialsReport,
  type MaterialsReportParams,
  type PeriodMaterialUsage,
  type TopMaterial,
} from '@/services/management.service';


const MANAGEMENT_ROLES = new Set(['menadzment', 'management', 'admin', 'administrator']);
const ALL_VALUE = 'ALL';

interface Company {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

function PeriodBarChart({ data }: { data: PeriodMaterialUsage[] }) {
  const { t } = useI18n();

  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('management.noMaterialData')}
      </p>
    );
  }

  const maxQty = Math.max(...data.map((d) => d.totalQuantity), 1);

  return (
    <div>
      {/* Bar chart */}
      <div className="flex h-36 items-end gap-1">
        {data.map((d) => {
          const heightPct = Math.max((d.totalQuantity / maxQty) * 100, 2);
          return (
            <div key={d.period} className="group relative flex flex-1 flex-col items-center">
              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md group-hover:block">
                <p className="font-semibold">{d.period}</p>
                <p>
                  {t('management.quantityColumn')}: <span className="font-medium">{d.totalQuantity}</span>
                </p>
                <p>
                  {t('management.materialsColumn')}: <span className="font-medium">{d.distinctMaterials}</span>
                </p>
              </div>

              {/* Bar */}
              <div className="flex w-full items-end" style={{ height: '100%' }}>
                <div
                  className="w-full cursor-default rounded-t-sm bg-primary/60 transition-colors group-hover:bg-primary"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis period labels */}
      <div className="mt-1.5 flex text-xs text-muted-foreground">
        {data.length <= 8 ? (
          data.map((d) => (
            <div key={d.period} className="flex-1 truncate px-0.5 text-center">
              {d.period.slice(2)} {/* YY-MM shorthand */}
            </div>
          ))
        ) : (
          <>
            <span className="flex-1 text-left">{data[0].period}</span>
            <span className="flex-1 text-center">{data[Math.floor(data.length / 2)].period}</span>
            <span className="flex-1 text-right">{data[data.length - 1].period}</span>
          </>
        )}
      </div>
    </div>
  );
}

function TopMaterialsTable({ data }: { data: TopMaterial[] }) {
  const { t } = useI18n();
  const maxQty = Math.max(...data.map((d) => d.totalQuantity), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="w-8 pb-3 pr-2">{t('management.rankColumn')}</th>
            <th className="pb-3 pr-4">{t('report.materialName')}</th>
            <th className="pb-3 px-4 text-right">{t('management.quantityColumn')}</th>
            <th className="pb-3 pl-4 text-right">{t('management.reportCountColumn')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row, idx) => {
            const barWidth = (row.totalQuantity / maxQty) * 100;
            return (
              <tr key={row.name} className="group transition-colors hover:bg-slate-50/80">
                <td className="py-2.5 pr-2 text-xs font-bold text-muted-foreground/50">
                  {idx + 1}
                </td>
                <td className="py-2.5 pr-4">
                  <p className="font-medium capitalize">{row.name}</p>
                  {/* Inline proportional bar */}
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right font-semibold tabular-nums">
                  {row.totalQuantity}
                </td>
                <td className="py-2.5 pl-4 text-right tabular-nums text-muted-foreground">
                  {row.reportCount}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CompanyTable({ data }: { data: CompanyMaterialUsage[] }) {
  const { t } = useI18n();
  const maxQty = Math.max(...data.map((d) => d.totalQuantity), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="pb-3 pr-4">{t('management.companyColumn')}</th>
            <th className="pb-3 pl-4 text-right">{t('management.quantityColumn')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row) => {
            const barWidth = (row.totalQuantity / maxQty) * 100;
            return (
              <tr key={row.companyId} className="transition-colors hover:bg-slate-50/80">
                <td className="py-2.5 pr-4">
                  <p className="font-medium">{row.companyName}</p>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500/60 transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </td>
                <td className="py-2.5 pl-4 text-right font-semibold tabular-nums">
                  {row.totalQuantity}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PeriodDetailTable({ data }: { data: PeriodMaterialUsage[] }) {
  const { t } = useI18n();

  if (!data.length) return null;

  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="pb-3 pr-4">{t('management.periodColumn')}</th>
            <th className="pb-3 px-4 text-right">{t('management.quantityColumn')}</th>
            <th className="pb-3 pl-4 text-right">{t('management.materialsColumn')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row) => (
            <tr key={row.period} className="transition-colors hover:bg-slate-50/80">
              <td className="py-2.5 pr-4 font-medium tabular-nums">{row.period}</td>
              <td className="py-2.5 px-4 text-right tabular-nums">{row.totalQuantity}</td>
              <td className="py-2.5 pl-4 text-right tabular-nums text-muted-foreground">
                {row.distinctMaterials}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-xl" />
      ))}
    </div>
  );
}

function unwrapList<T>(raw: T[] | { data: T[] } | unknown): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw !== null && typeof raw === 'object' && 'data' in (raw as object)) {
    const inner = (raw as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}


export default function ManagementMaterialsPage() {
  const { language, t } = useI18n();
  const [authorized, setAuthorized] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState<MaterialsReport | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState(ALL_VALUE);
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_VALUE);
  const [appliedParams, setAppliedParams] = useState<MaterialsReportParams>({});

  const isFiltered =
    !!appliedParams.from ||
    !!appliedParams.to ||
    appliedParams.companyId !== undefined ||
    appliedParams.categoryId !== undefined;

  const buildParams = useCallback((): MaterialsReportParams => {
    const params: MaterialsReportParams = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    if (selectedCompanyId !== ALL_VALUE) params.companyId = Number(selectedCompanyId);
    if (selectedCategoryId !== ALL_VALUE) params.categoryId = Number(selectedCategoryId);
    return params;
  }, [fromDate, toDate, selectedCompanyId, selectedCategoryId]);

  const loadReport = useCallback(
    async (params: MaterialsReportParams) => {
      setLoading(true);
      setError('');
      try {
        const data = await getMaterialsReport(params);
        setReport(data);
        setAppliedParams(params);
      } catch (err) {
        setError(
          translateText(
            language,
            err instanceof Error ? err.message : 'Failed to load materials report.',
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [language],
  );

  const handleApply = () => void loadReport(buildParams());

  const handleClear = () => {
    setFromDate('');
    setToDate('');
    setSelectedCompanyId(ALL_VALUE);
    setSelectedCategoryId(ALL_VALUE);
    void loadReport({});
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    const canView = hasSessionRole(MANAGEMENT_ROLES);
    setAuthorized(canView);
    setIsGuest(!token);

    if (!canView) {
      setLoading(false);
      return;
    }

    const init = async () => {
      setLoading(true);
      const [reportRes, companiesRes, categoriesRes] = await Promise.allSettled([
        getMaterialsReport({}),
        api.get<unknown>(API_ENDPOINTS.COMPANIES.BASE),
        api.get<unknown>(API_ENDPOINTS.CATEGORIES.BASE),
      ]);

      if (reportRes.status === 'fulfilled') {
        setReport(reportRes.value);
      } else {
        setError(
          reportRes.reason instanceof Error
            ? translateText(language, reportRes.reason.message)
            : 'Failed to load materials report.',
        );
      }

      if (companiesRes.status === 'fulfilled') {
        setCompanies(unwrapList<Company>(companiesRes.value.data));
      }

      if (categoriesRes.status === 'fulfilled') {
        setCategories(unwrapList<Category>(categoriesRes.value.data));
      }

      setLoading(false);
    };

    void init();
  }, []);

  /* ── Render: access guard ── */
  if (!authorized) {
    return (
      <AccessDenied
        reason={isGuest ? 'unauthenticated' : 'unauthorized'}
        requiredRole="Management / Admin"
      />
    );
  }

  const hasData = !!report?.totalReportsWithMaterials;

  return (
    <PageLayout className="space-y-6">
      {/* ── Page header ── */}
      <PageHeader
        title={t('management.materialsTitle')}
        subtitle={t('management.materialsSubtitle')}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: ROUTES.DASHBOARD },
          {
            label:
              language === 'bs' ? 'Menadžment kontrolna ploča' : 'Management Dashboard',
            href: ROUTES.MANAGEMENT_DASHBOARD,
          },
          { label: t('management.materialsTitle') },
        ]}
        primaryAction={{
          label: t('dashboard.refresh'),
          onClick: () => void loadReport(appliedParams),
          variant: 'outline',
          icon: <RefreshCw className="mr-1.5 size-4" aria-hidden="true" />,
          isLoading: loading,
        }}
      />

      {/* ── Error banner ── */}
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {/* ── Filter card ── */}
      <Card className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
        <CardContent className="pt-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* From date */}
            <div className="space-y-1.5">
              <Label htmlFor="filter-from">{t('management.filterFrom')}</Label>
              <Input
                id="filter-from"
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            {/* To date */}
            <div className="space-y-1.5">
              <Label htmlFor="filter-to">{t('management.filterTo')}</Label>
              <Input
                id="filter-to"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <Label htmlFor="filter-company">{t('management.filterCompany')}</Label>
              <Select 
                value={selectedCompanyId} 
                onValueChange={(val) => setSelectedCompanyId(val ?? ALL_VALUE)}
              >
                <SelectTrigger id="filter-company" className="h-8">
                  <SelectValue>
                    {selectedCompanyId === ALL_VALUE 
                      ? (language === 'bs' ? 'Sve kompanije' : 'All companies')
                      : companies.find((c) => String(c.id) === selectedCompanyId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>
                    {language === 'bs' ? 'Sve kompanije' : 'All companies'}
                  </SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="filter-category">{t('management.filterCategory')}</Label>
              <Select 
                value={selectedCategoryId} 
                onValueChange={(val) => setSelectedCategoryId(val ?? ALL_VALUE)}
              >
                <SelectTrigger id="filter-category" className="h-8">
                  <SelectValue>
                    {selectedCategoryId === ALL_VALUE 
                      ? (language === 'bs' ? 'Sve kategorije' : 'All categories')
                      : categories.find((c) => String(c.id) === selectedCategoryId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>
                    {language === 'bs' ? 'Sve kategorije' : 'All categories'}
                  </SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter actions */}
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" onClick={handleApply} disabled={loading}>
              {t('management.applyFilters')}
            </Button>
            {isFiltered && (
              <Button size="sm" variant="outline" onClick={handleClear} disabled={loading}>
                {t('management.clearFilters')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Stat cards ── */}
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Material statistics">
        <StatCard
          title={t('management.totalQuantity')}
          value={report?.totalQuantity ?? 0}
          icon={<Package className="size-5 text-primary" aria-hidden="true" />}
          isLoading={loading}
        />
        <StatCard
          title={t('management.distinctMaterials')}
          value={report?.totalDistinctMaterials ?? 0}
          icon={<Box className="size-5 text-violet-500" aria-hidden="true" />}
          isLoading={loading}
        />
        <StatCard
          title={t('management.reportsWithMaterials')}
          value={report?.totalReportsWithMaterials ?? 0}
          icon={<BarChart2 className="size-5 text-emerald-600" aria-hidden="true" />}
          isLoading={loading}
        />
      </section>

      {/* ── Empty state ── */}
      {!loading && !error && !hasData ? (
        <Card className="rounded-2xl border border-slate-200/70">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-3 size-10 text-muted-foreground/30" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t('management.noMaterialData')}</p>
            {isFiltered && (
              <Button variant="link" size="sm" className="mt-2" onClick={handleClear}>
                {t('management.clearFilters')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Period chart card ── */}
          <Card className="stat-card-glow rounded-2xl border border-slate-200/70 bg-white/90 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50">
                <TrendingUp className="size-5 text-blue-600" aria-hidden="true" />
              </div>
              <CardTitle className="text-base font-bold">
                {t('management.materialsByPeriod')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-44 w-full rounded-xl" />
              ) : (
                <>
                  <PeriodBarChart data={report?.byPeriod ?? []} />
                  <PeriodDetailTable data={report?.byPeriod ?? []} />
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Two-column: top materials + by company ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top materials */}
            <Card className="stat-card-glow rounded-2xl border border-slate-200/70 bg-white/90 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50">
                  <BarChart2 className="size-5 text-purple-600" aria-hidden="true" />
                </div>
                <CardTitle className="text-base font-bold">
                  {t('management.topMaterials')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <CardSkeleton rows={5} />
                ) : (report?.topMaterials.length ?? 0) === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {t('management.noMaterialData')}
                  </p>
                ) : (
                  <TopMaterialsTable data={report!.topMaterials} />
                )}
              </CardContent>
            </Card>

            {/* By company */}
            <Card className="stat-card-glow rounded-2xl border border-slate-200/70 bg-white/90 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50">
                  <Package className="size-5 text-emerald-600" aria-hidden="true" />
                </div>
                <CardTitle className="text-base font-bold">
                  {t('management.materialsByCompany')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <CardSkeleton rows={5} />
                ) : (report?.byCompany.length ?? 0) === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {t('management.noMaterialData')}
                  </p>
                ) : (
                  <CompanyTable data={report!.byCompany} />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PageLayout>
  );
}