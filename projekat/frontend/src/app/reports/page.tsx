'use client';
export const runtime = 'edge';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart2,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  Hourglass,
  Star,
} from 'lucide-react';

import type { InterventionStatus, Priority } from '@shared/enums';
import { INTERVENTION_STATUS, PRIORITY } from '@shared/enums';

import { ROUTES } from '@/constants';
import {
  DataTable,
  EmptyState,
  FilterBar,
  InterventionStatusBadge,
  PageHeader,
  PageLayout,
  PriorityBadge,
  StatCard,
} from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  translateCategoryName,
  translateInterventionStatus,
  useI18n,
  type LanguageCode,
} from '@/lib/i18n';
import {
  getInterventionById,
  getInterventionHistory,
  getInterventions,
  type InterventionDetail,
  type InterventionHistoryItem,
  type InterventionListItem,
} from '@/services/interventions.service';
import {
  getInterventionReport,
  type InterventionReport,
} from '@/services/reports.service';
import {
  getFeedbackAnalytics,
  getInterventionFeedback,
  type FeedbackAnalytics,
  type InterventionFeedback,
} from '@/services/feedback.service';
import { hasSessionRole } from '@/lib/auth';

const ALL = 'ALL';
const WITH_REPORT = 'WITH_REPORT';
const WITHOUT_REPORT = 'WITHOUT_REPORT';
const UNKNOWN_REPORT = 'UNKNOWN_REPORT';
const FEEDBACK_ANALYTICS_ROLES = new Set([
  'koordinator',
  'coordinator',
  'management',
  'menadzment',
  'admin',
  'administrator',
]);

function buildStatusFilters(language: LanguageCode) {
  return [
  { value: ALL, label: 'All statuses' },
  { value: INTERVENTION_STATUS.NEW, label: translateInterventionStatus(language, INTERVENTION_STATUS.NEW) },
  { value: INTERVENTION_STATUS.ASSIGNED, label: translateInterventionStatus(language, INTERVENTION_STATUS.ASSIGNED) },
  { value: INTERVENTION_STATUS.IN_PROGRESS, label: translateInterventionStatus(language, INTERVENTION_STATUS.IN_PROGRESS) },
  { value: INTERVENTION_STATUS.ON_HOLD, label: translateInterventionStatus(language, INTERVENTION_STATUS.ON_HOLD) },
  { value: INTERVENTION_STATUS.RESOLVED, label: translateInterventionStatus(language, INTERVENTION_STATUS.RESOLVED) },
  { value: INTERVENTION_STATUS.CANCELLED, label: translateInterventionStatus(language, INTERVENTION_STATUS.CANCELLED) },
  { value: INTERVENTION_STATUS.REJECTED, label: translateInterventionStatus(language, INTERVENTION_STATUS.REJECTED) },
  ];
}

const PRIORITY_FILTERS = [
  { value: ALL, label: 'All priorities' },
  { value: PRIORITY.CRITICAL, label: 'Critical' },
  { value: PRIORITY.HIGH, label: 'High' },
  { value: PRIORITY.MEDIUM, label: 'Normal' },
  { value: PRIORITY.LOW, label: 'Low' },
];

const REPORT_FILTERS = [
  { value: ALL, label: 'All reports' },
  { value: WITH_REPORT, label: 'Submitted' },
  { value: WITHOUT_REPORT, label: 'Missing' },
  { value: UNKNOWN_REPORT, label: 'Not checked' },
];

type ReportLookupItem = {
  report: InterventionReport | null;
  error?: string;
};

type ReportIntervention = Pick<
  InterventionListItem | InterventionDetail,
  | 'id'
  | 'name'
  | 'location'
  | 'categoryName'
  | 'companyName'
  | 'priority'
  | 'status'
  | 'owner'
  | 'startedAt'
  | 'dueAt'
>;

type ReportRow = ReportIntervention & {
  report: InterventionReport | null;
  reportError?: string;
  isReportKnown: boolean;
};

function formatDateTime(value: string | null | undefined, language: LanguageCode) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat(language === 'bs' ? 'bs-BA' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getReportLabel(row: ReportRow, language: LanguageCode) {
  if (!row.isReportKnown) return language === 'bs' ? 'Provjera' : 'Checking';
  if (row.reportError) return language === 'bs' ? 'Nedostupno' : 'Unavailable';
  return row.report ? (language === 'bs' ? 'Poslan' : 'Submitted') : (language === 'bs' ? 'Nedostaje' : 'Missing');
}

function getSelectedIdFromUrl() {
  if (typeof window === 'undefined') return null;

  const value = new URLSearchParams(window.location.search).get('interventionId')?.trim();
  return value || null;
}

function mergeInterventions(items: ReportIntervention[]) {
  const byId = new Map<string, ReportIntervention>();

  items.forEach((item) => {
    const existing = byId.get(item.id);
    if (!existing || existing.companyName === '-') {
      byId.set(item.id, item);
    }
  });

  return Array.from(byId.values());
}

function historyItemToReportIntervention(item: InterventionHistoryItem): ReportIntervention {
  return {
    id: item.id,
    name: item.summary || `Intervention #${item.id}`,
    location: item.location,
    categoryName: item.categoryName,
    companyName: '-',
    priority: item.priority,
    status: item.status,
    owner: item.servicer,
    startedAt: item.date,
    dueAt: null,
  };
}

async function loadAllHistoryInterventions(): Promise<ReportIntervention[]> {
  const firstPage = await getInterventionHistory({ page: 1, pageSize: 50 });
  const items = [...firstPage.data];

  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const nextPage = await getInterventionHistory({ page, pageSize: 50 });
    items.push(...nextPage.data);
  }

  return items.map(historyItemToReportIntervention);
}

type FeedbackBreakdownRow = {
  label: string;
  feedbackCount: number;
  averageRating: number | null;
  negativeCount: number;
};

function formatRatingValue(value: number | null | undefined) {
  if (value == null) return '-';
  return value.toFixed(2).replace(/\.?0+$/, '');
}

function formatFeedbackPeriod(period: string, language: LanguageCode) {
  const [year, month] = period.split('-').map(Number);

  if (!year || !month) return period;

  return new Intl.DateTimeFormat(language === 'bs' ? 'bs-BA' : 'en-US', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function FeedbackPanelSkeleton() {
  return (
    <div className="rounded-lg border bg-background p-4">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="mt-4 h-44 w-full" />
    </div>
  );
}

function FeedbackTrendPanel({
  trends,
  isLoading,
  language,
}: {
  trends: FeedbackAnalytics['trends'];
  isLoading: boolean;
  language: LanguageCode;
}) {
  if (isLoading && trends.length === 0) return <FeedbackPanelSkeleton />;

  const sortedTrends = [...trends].sort((a, b) => a.period.localeCompare(b.period));
  const maxFeedbackCount = Math.max(1, ...sortedTrends.map((item) => item.feedbackCount));
  const latestTrend = sortedTrends[sortedTrends.length - 1];

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-background p-4">
        <div>
          <h3 className="text-sm font-semibold">
            {language === 'bs' ? 'Mjesečni trend feedbacka' : 'Monthly feedback trend'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'bs'
              ? 'Plavi stub pokazuje prosječnu ocjenu, svijetla pozadina broj feedbacka.'
              : 'Blue bar shows average rating, pale background shows feedback volume.'}
          </p>
        </div>
        {latestTrend ? (
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-right">
            <p className="text-xs text-muted-foreground">
              {language === 'bs' ? 'Zadnji period' : 'Latest period'}
            </p>
            <p className="text-sm font-semibold">
              {formatFeedbackPeriod(latestTrend.period, language)} · {formatRatingValue(latestTrend.averageRating)}/5
            </p>
          </div>
        ) : null}
      </div>

      {sortedTrends.length === 0 ? (
        <div className="m-4 flex h-56 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          {language === 'bs' ? 'Nema feedbacka za odabrane filtere.' : 'No feedback for the selected filters.'}
        </div>
      ) : (
        <div className="p-4">
          <div className="overflow-x-auto rounded-md border bg-muted/10">
            <div className="grid min-w-[34rem] grid-cols-[2.25rem_1fr] gap-3 p-4">
              <div className="relative h-64 text-xs text-muted-foreground">
                <span className="absolute top-0 right-0">5</span>
                <span className="absolute top-1/2 right-0 -translate-y-1/2">3</span>
                <span className="absolute bottom-0 right-0">1</span>
              </div>
              <div className="relative h-64">
                <div className="absolute inset-x-0 top-0 border-t border-dashed" />
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed" />
                <div className="absolute inset-x-0 bottom-0 border-t" />
                <div className="relative z-10 flex h-full min-w-full items-end gap-5 px-3">
                  {sortedTrends.map((item) => {
                    const averageRating = Math.min(Math.max(item.averageRating ?? 1, 1), 5);
                    const ratingHeight = Math.max((averageRating / 5) * 100, 8);
                    const volumeHeight = Math.max((item.feedbackCount / maxFeedbackCount) * 100, 10);

                    return (
                      <div key={item.period} className="flex h-full min-w-[5.75rem] flex-1 flex-col justify-end gap-2">
                        <div className="text-center">
                          <p className="text-sm font-semibold text-foreground">
                            {formatRatingValue(item.averageRating)}/5
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.feedbackCount} {language === 'bs' ? 'zapisa' : 'records'}
                          </p>
                        </div>
                        <div className="relative mx-auto h-44 w-14 rounded-t-md bg-blue-100">
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-t-md bg-blue-600"
                            style={{ height: `${ratingHeight}%` }}
                            title={`${formatRatingValue(item.averageRating)}/5`}
                          />
                          <div
                            className="absolute bottom-0 left-1 right-1 rounded-t-md border-2 border-blue-300/80"
                            style={{ height: `${volumeHeight}%` }}
                            title={`${item.feedbackCount} feedback`}
                          />
                          {item.negativeCount > 0 ? (
                            <div
                              className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-sm"
                              title={`${item.negativeCount} negative`}
                            >
                              {item.negativeCount}
                            </div>
                          ) : null}
                        </div>
                        <p className="text-center text-xs text-muted-foreground">
                          {formatFeedbackPeriod(item.period, language)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
              {language === 'bs' ? 'Prosjecna ocjena' : 'Average rating'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border-2 border-blue-300 bg-blue-100" />
              {language === 'bs' ? 'Broj feedbacka' : 'Feedback volume'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
              {language === 'bs' ? 'Broj negativnih ocjena' : 'Negative rating count'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function RatingDistributionPanel({
  distribution,
  total,
  isLoading,
  language,
}: {
  distribution: FeedbackAnalytics['ratingDistribution'];
  total: number;
  isLoading: boolean;
  language: LanguageCode;
}) {
  if (isLoading && distribution.length === 0) return <FeedbackPanelSkeleton />;

  const rows = [5, 4, 3, 2, 1].map(
    (rating) =>
      distribution.find((item) => item.rating === rating) ?? {
        rating,
        count: 0,
        percentage: 0,
      },
  );

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">
            {language === 'bs' ? 'Raspodjela ocjena' : 'Rating distribution'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'bs' ? `${total} ukupno` : `${total} total`}
          </p>
        </div>
        <Star className="h-4 w-4 text-primary" />
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((item) => (
          <div key={item.rating} className="grid grid-cols-[3rem_1fr_4.5rem] items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 font-medium">
              {item.rating}
              <Star className="h-3.5 w-3.5 text-primary" />
            </span>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${item.count > 0 ? Math.max(item.percentage, 4) : 0}%` }}
              />
            </div>
            <span className="text-right text-muted-foreground">
              {item.count} ({formatRatingValue(item.percentage)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackBreakdownPanel({
  title,
  rows,
  emptyText,
  description,
  language,
  isLoading,
}: {
  title: string;
  rows: FeedbackBreakdownRow[];
  emptyText: string;
  description?: string;
  language: LanguageCode;
  isLoading: boolean;
}) {
  if (isLoading && rows.length === 0) return <FeedbackPanelSkeleton />;

  const sortedRows = [...rows]
    .sort((a, b) => b.feedbackCount - a.feedbackCount || (b.averageRating ?? 0) - (a.averageRating ?? 0));
  const maxCount = Math.max(1, ...sortedRows.map((row) => row.feedbackCount));

  return (
    <div className="rounded-lg border bg-background p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4 max-h-80 space-y-4 overflow-y-auto pr-1">
        {sortedRows.length === 0 ? (
          <p className="flex h-28 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          sortedRows.map((row) => (
            <div key={row.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{row.label}</span>
                <span className="text-muted-foreground">{row.feedbackCount}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(row.feedbackCount / maxCount) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {language === 'bs' ? 'Prosjek' : 'Average'} {formatRatingValue(row.averageRating)}
                </span>
                <span>
                  {language === 'bs' ? 'Negativno' : 'Negative'} {row.negativeCount}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { language, t } = useI18n();
  const [interventions, setInterventions] = useState<ReportIntervention[]>([]);
  const [selectedIntervention, setSelectedIntervention] =
    useState<ReportIntervention | null>(null);
  const [reportsByInterventionId, setReportsByInterventionId] = useState<
    Record<string, ReportLookupItem>
  >({});
  const [selectedInterventionId, setSelectedInterventionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(ALL);
  const [selectedPriority, setSelectedPriority] = useState(ALL);
  const [selectedReportState, setSelectedReportState] = useState(ALL);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canViewFeedbackAnalytics, setCanViewFeedbackAnalytics] = useState(false);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [feedbackFilters, setFeedbackFilters] = useState({ from: '', to: '', companyId: ALL, categoryId: ALL, servicerId: ALL });
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const loadFeedbackAnalytics = async (filters = feedbackFilters) => {
    if (!hasSessionRole(FEEDBACK_ANALYTICS_ROLES)) return;

    setCanViewFeedbackAnalytics(true);
    setIsLoadingFeedback(true);
    setFeedbackError(null);
    try {
      const analytics = await getFeedbackAnalytics({
        from: filters.from ? new Date(filters.from).toISOString() : undefined,
        to: filters.to ? new Date(filters.to).toISOString() : undefined,
        companyId: filters.companyId === ALL ? undefined : filters.companyId,
        categoryId: filters.categoryId === ALL ? undefined : filters.categoryId,
        servicerId: filters.servicerId === ALL ? undefined : filters.servicerId,
      });
      setFeedbackAnalytics(analytics);
    } catch (requestError) {
      setFeedbackError(requestError instanceof Error ? requestError.message : 'Failed to load feedback analytics.');
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const loadReportsForInterventions = async (items: ReportIntervention[]) => {
    setIsLoadingReports(true);

    const uniqueIds = Array.from(new Set(items.map((item) => item.id)));
    const results = await Promise.allSettled(
      uniqueIds.map(async (id) => {
        const numericId = Number(id);

        if (!Number.isInteger(numericId) || numericId <= 0) {
          return [
            id,
            { report: null, error: 'Invalid intervention identifier.' },
          ] as const;
        }

        try {
          const report = await getInterventionReport(numericId);
          return [id, { report }] as const;
        } catch (requestError) {
          return [
            id,
            {
              report: null,
              error:
                requestError instanceof Error
                  ? requestError.message
                  : 'Failed to load report.',
            },
          ] as const;
        }
      }),
    );

    const nextLookup: Record<string, ReportLookupItem> = {};
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const [id, lookup] = result.value;
        nextLookup[id] = lookup;
      }
    });

    setReportsByInterventionId(nextLookup);
    setIsLoadingReports(false);
  };

  const loadData = async () => {
    const initialSelectedId = getSelectedIdFromUrl();
    setSelectedInterventionId(initialSelectedId);
    setIsLoading(true);
      setError(null);
      setCanViewFeedbackAnalytics(hasSessionRole(FEEDBACK_ANALYTICS_ROLES));

    try {
      const [interventionResult, historyInterventions] = await Promise.all([
        getInterventions(),
        loadAllHistoryInterventions().catch(() => []),
      ]);
      const activeInterventions: ReportIntervention[] = interventionResult.items;
      let highlightedIntervention: ReportIntervention | null = null;
      let loadedInterventions = mergeInterventions([
        ...activeInterventions,
        ...historyInterventions,
      ]);

      if (initialSelectedId) {
        const numericSelectedId = Number(initialSelectedId);
        if (Number.isInteger(numericSelectedId) && numericSelectedId > 0) {
          try {
            highlightedIntervention = await getInterventionById(numericSelectedId);
          } catch {
            highlightedIntervention = null;
          }
        }
      }

      if (highlightedIntervention) {
        loadedInterventions = mergeInterventions([
          highlightedIntervention,
          ...loadedInterventions,
        ]);
      }

      setInterventions(loadedInterventions);
      setSelectedIntervention(highlightedIntervention);

      const reportTargets = highlightedIntervention
        ? [...loadedInterventions, highlightedIntervention]
        : loadedInterventions;
      void loadReportsForInterventions(reportTargets);
      void loadFeedbackAnalytics();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load reports.',
      );
      setReportsByInterventionId({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const rows: ReportRow[] = useMemo(
    () =>
      interventions.map((intervention) => {
        const lookup = reportsByInterventionId[intervention.id];
        return {
          ...intervention,
          report: lookup?.report ?? null,
          reportError: lookup?.error,
          isReportKnown: Boolean(lookup),
        };
      }),
    [interventions, reportsByInterventionId],
  );

  const selectedRow = useMemo<ReportRow | null>(() => {
    if (!selectedInterventionId) return null;

    const fromRows = rows.find((row) => row.id === selectedInterventionId);
    if (fromRows) return fromRows;

    if (!selectedIntervention) return null;

    const lookup = reportsByInterventionId[selectedIntervention.id];
    return {
      ...selectedIntervention,
      report: lookup?.report ?? null,
      reportError: lookup?.error,
      isReportKnown: Boolean(lookup),
    };
  }, [reportsByInterventionId, rows, selectedIntervention, selectedInterventionId]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (selectedStatus !== ALL && row.status !== selectedStatus) return false;
      if (selectedPriority !== ALL && row.priority !== selectedPriority) return false;

      if (selectedReportState === WITH_REPORT && !row.report) return false;
      if (
        selectedReportState === WITHOUT_REPORT &&
        (!row.isReportKnown || row.report || row.reportError)
      ) {
        return false;
      }
      if (
        selectedReportState === UNKNOWN_REPORT &&
        (row.isReportKnown && !row.reportError)
      ) {
        return false;
      }

      if (!normalizedSearch) return true;

      const reportAuthor = row.report
        ? `${row.report.author.firstName} ${row.report.author.lastName} ${row.report.author.username}`
        : '';

      return [
        row.id,
        row.name,
        row.location,
        row.categoryName,
        row.companyName,
        row.owner,
        reportAuthor,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [rows, search, selectedPriority, selectedReportState, selectedStatus]);

  const knownRows = rows.filter((row) => row.isReportKnown && !row.reportError);
  const submittedCount = knownRows.filter((row) => row.report).length;
  const missingCount = knownRows.filter((row) => !row.report).length;
  const isFiltered =
    search.trim().length > 0 ||
    selectedStatus !== ALL ||
    selectedPriority !== ALL ||
    selectedReportState !== ALL;

  const clearFilters = () => {
    setSearch('');
    setSelectedStatus(ALL);
    setSelectedPriority(ALL);
    setSelectedReportState(ALL);
  };

  const companyFilterItems = (feedbackAnalytics?.byCompany ?? []).map((item) => ({
    companyId: item.companyId,
    companyName: item.companyName,
  }));
  const categoryFilterItems = (feedbackAnalytics?.byCategory ?? []).map((item) => ({
    categoryId: item.categoryId,
    categoryName: item.categoryName,
  }));
  const servicerFilterItems = (feedbackAnalytics?.byServicer ?? [])
    .filter((item) => item.servicerId !== null)
    .map((item) => ({
      servicerId: item.servicerId as number,
      servicerName: item.servicerName,
    }));

  const companyFeedbackOptions = [
    { value: ALL, label: language === 'bs' ? 'Sve firme' : 'All companies' },
    ...companyFilterItems.map((item) => ({
      value: String(item.companyId),
      label: item.companyName,
    })),
  ];
  const categoryFeedbackOptions = [
    { value: ALL, label: language === 'bs' ? 'Sve kategorije' : 'All categories' },
    ...categoryFilterItems.map((item) => ({
      value: String(item.categoryId),
      label: translateCategoryName(language, item.categoryName),
    })),
  ];
  const servicerFeedbackOptions = [
    { value: ALL, label: language === 'bs' ? 'Svi serviseri' : 'All servicers' },
    ...servicerFilterItems.map((item) => ({
      value: String(item.servicerId),
      label: item.servicerName || `#${item.servicerId}`,
    })),
  ];
  const companyFeedbackRows = (feedbackAnalytics?.byCompany ?? []).map((item) => ({
    label: item.companyName,
    feedbackCount: item.feedbackCount,
    averageRating: item.averageRating,
    negativeCount: item.negativeCount,
  }));
  const categoryFeedbackRows = (feedbackAnalytics?.byCategory ?? []).map((item) => ({
    label: translateCategoryName(language, item.categoryName),
    feedbackCount: item.feedbackCount,
    averageRating: item.averageRating,
    negativeCount: item.negativeCount,
  }));
  const servicerFeedbackRows = (feedbackAnalytics?.byServicer ?? []).map((item) => ({
    label:
      item.servicerId === null
        ? language === 'bs' ? 'Nedodijeljeno' : 'Unassigned'
        : item.servicerName || `#${item.servicerId}`,
    feedbackCount: item.feedbackCount,
    averageRating: item.averageRating,
    negativeCount: item.negativeCount,
  }));

  const selectRow = (row: ReportRow) => {
    setSelectedInterventionId(row.id);
    setSelectedIntervention(null);
    window.history.replaceState(
      null,
      '',
      `${ROUTES.REPORTS}?interventionId=${encodeURIComponent(row.id)}`,
    );
  };

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={t('nav.reports')}
        subtitle={language === 'bs' ? 'Pregledajte poslane izvještaje intervencija i pratite dokumentaciju koja nedostaje.' : 'Review submitted intervention reports and follow up on missing documentation.'}
        breadcrumbs={[{ label: t('nav.dashboard'), href: ROUTES.DASHBOARD }, { label: t('nav.reports') }]}
        secondaryActions={[
          {
            label: t('nav.history'),
            href: ROUTES.HISTORY,
            variant: 'outline',
            icon: <Hourglass className="mr-2 h-4 w-4" />,
          },
        ]}
        primaryAction={{
          label: t('dashboard.refresh'),
          onClick: loadData,
          isLoading: isLoading || isLoadingReports,
          icon: <BarChart2 className="mr-2 h-4 w-4" />,
        }}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('nav.interventions')}
          value={rows.length}
          isLoading={isLoading}
          icon={<ClipboardList className="size-5" />}
        />
        <StatCard
          title={language === 'bs' ? 'Poslani izvještaji' : 'Submitted reports'}
          value={submittedCount}
          isLoading={isLoading || isLoadingReports}
          icon={<CheckCircle2 className="size-5" />}
        />
        <StatCard
          title={language === 'bs' ? 'Izvještaji koji nedostaju' : 'Missing reports'}
          value={missingCount}
          isLoading={isLoading || isLoadingReports}
          icon={<FileText className="size-5" />}
        />
        <StatCard
          title={language === 'bs' ? 'Odabrano' : 'Selected'}
          value={selectedInterventionId ? `#${selectedInterventionId}` : '-'}
          isLoading={isLoading}
          icon={<ExternalLink className="size-5" />}
        />
      </section>

      {canViewFeedbackAnalytics ? (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'bs' ? 'Analitika feedbacka' : 'Feedback Analytics'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {feedbackError ? <p className="text-sm text-destructive">{feedbackError}</p> : null}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
              <input
                type="date"
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={feedbackFilters.from}
                onChange={(event) => setFeedbackFilters((current) => ({ ...current, from: event.target.value }))}
                aria-label={language === 'bs' ? 'Od datuma' : 'From date'}
              />
              <input
                type="date"
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={feedbackFilters.to}
                onChange={(event) => setFeedbackFilters((current) => ({ ...current, to: event.target.value }))}
                aria-label={language === 'bs' ? 'Do datuma' : 'To date'}
              />
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={feedbackFilters.companyId}
                onChange={(event) => setFeedbackFilters((current) => ({ ...current, companyId: event.target.value }))}
              >
                {companyFeedbackOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={feedbackFilters.categoryId}
                onChange={(event) => setFeedbackFilters((current) => ({ ...current, categoryId: event.target.value }))}
              >
                {categoryFeedbackOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={feedbackFilters.servicerId}
                onChange={(event) => setFeedbackFilters((current) => ({ ...current, servicerId: event.target.value }))}
              >
                {servicerFeedbackOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <Button type="button" onClick={() => void loadFeedbackAnalytics(feedbackFilters)} disabled={isLoadingFeedback}>
                {isLoadingFeedback ? (language === 'bs' ? 'Ucitavanje...' : 'Loading...') : (language === 'bs' ? 'Primijeni' : 'Apply')}
              </Button>
            </div>
            <section className="grid gap-4 sm:grid-cols-3">
              <StatCard title={language === 'bs' ? 'Prosjecna ocjena' : 'Average rating'} value={feedbackAnalytics?.summary.averageRating == null ? '-' : `${formatRatingValue(feedbackAnalytics.summary.averageRating)}/5`} isLoading={isLoadingFeedback} icon={<Star className="size-5" />} />
              <StatCard title={language === 'bs' ? 'Feedback zapisi' : 'Feedback records'} value={feedbackAnalytics?.summary.feedbackCount ?? 0} isLoading={isLoadingFeedback} icon={<ClipboardList className="size-5" />} />
              <StatCard title={language === 'bs' ? 'Negativni feedback' : 'Negative feedback'} value={feedbackAnalytics?.summary.negativeCount ?? 0} isLoading={isLoadingFeedback} icon={<FileText className="size-5" />} />
            </section>
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
              <FeedbackTrendPanel
                trends={feedbackAnalytics?.trends ?? []}
                isLoading={isLoadingFeedback}
                language={language}
              />
              <RatingDistributionPanel
                distribution={feedbackAnalytics?.ratingDistribution ?? []}
                total={feedbackAnalytics?.summary.feedbackCount ?? 0}
                isLoading={isLoadingFeedback}
                language={language}
              />
            </section>
            <section className="grid gap-4 xl:grid-cols-3">
              <FeedbackBreakdownPanel
                title={language === 'bs' ? 'Po firmama' : 'By company'}
                emptyText={language === 'bs' ? 'Nema podataka za firme.' : 'No company data yet.'}
                rows={companyFeedbackRows}
                language={language}
                isLoading={isLoadingFeedback}
              />
              <FeedbackBreakdownPanel
                title={language === 'bs' ? 'Po kategorijama' : 'By category'}
                emptyText={language === 'bs' ? 'Nema podataka za kategorije.' : 'No category data yet.'}
                rows={categoryFeedbackRows}
                language={language}
                isLoading={isLoadingFeedback}
              />
              <FeedbackBreakdownPanel
                title={language === 'bs' ? 'Po serviserima' : 'By servicer'}
                emptyText={language === 'bs' ? 'Nema podataka za servisere.' : 'No servicer data yet.'}
                description={
                  language === 'bs'
                    ? 'Nedodijeljeno znaci da intervencija trenutno nema dodijeljenog servisera; negativan feedback ne uklanja servisera.'
                    : 'Unassigned means the intervention currently has no assigned servicer; negative feedback does not remove a servicer.'
                }
                rows={servicerFeedbackRows}
                language={language}
                isLoading={isLoadingFeedback}
              />
            </section>
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">
                  {language === 'bs' ? 'Negativni feedback za pregled' : 'Negative feedback to review'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'bs'
                    ? `Ocjene ${feedbackAnalytics?.summary.negativeThreshold ?? 2} i nize se izdvajaju za brzu provjeru.`
                    : `Ratings ${feedbackAnalytics?.summary.negativeThreshold ?? 2} and below are highlighted for quick review.`}
                </p>
              </div>
              <DataTable
                columns={[
                  { key: 'interventionName', header: language === 'bs' ? 'Intervencija' : 'Intervention' },
                  { key: 'rating', header: language === 'bs' ? 'Ocjena' : 'Rating', width: '90px' },
                  { key: 'companyName', header: language === 'bs' ? 'Firma' : 'Company' },
                  { key: 'categoryName', header: language === 'bs' ? 'Kategorija' : 'Category', render: (value) => translateCategoryName(language, String(value)) },
                  { key: 'comment', header: 'Feedback', render: (value) => String(value ?? '-') },
                  {
                    key: 'actions',
                    header: '',
                    align: 'right',
                    render: (_value, row) => (
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={ROUTES.INTERVENTION(String((row as { interventionId: number }).interventionId))}>
                          {language === 'bs' ? 'Otvori' : 'Open'}
                        </Link>
                      </Button>
                    ),
                  },
                ]}
                data={feedbackAnalytics?.negativeFeedback ?? []}
                keyExtractor={(row) => String(row.id)}
                isLoading={isLoadingFeedback}
                emptyTitle={language === 'bs' ? 'Nema negativnog feedbacka' : 'No negative feedback'}
                emptyDescription={language === 'bs' ? 'Odabrani filteri nemaju negativne ocjene.' : 'The selected filters have no negative ratings.'}
              />
            </section>
          </CardContent>
        </Card>
      ) : null}

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: language === 'bs' ? 'Pretraži intervenciju, lokaciju, odgovornu osobu...' : 'Search intervention, location, owner...',
        }}
        filters={[
          {
            key: 'report-state',
            label: t('nav.reports'),
            value: selectedReportState,
            onChange: setSelectedReportState,
            options: REPORT_FILTERS.map((option) => ({
              ...option,
              label: option.value === ALL ? (language === 'bs' ? 'Svi izvještaji' : option.label)
                : option.value === WITH_REPORT ? (language === 'bs' ? 'Poslan' : option.label)
                : option.value === WITHOUT_REPORT ? (language === 'bs' ? 'Nedostaje' : option.label)
                : (language === 'bs' ? 'Nije provjereno' : option.label),
            })),
          },
          {
            key: 'status',
            label: t('interventionDetail.status'),
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: buildStatusFilters(language).map((option) => ({
              ...option,
              label: option.value === ALL && language === 'bs' ? 'Svi statusi' : option.label,
            })),
          },
          {
            key: 'priority',
            label: t('interventionDetail.priority'),
            value: selectedPriority,
            onChange: setSelectedPriority,
            options: PRIORITY_FILTERS.map((option) => ({
              ...option,
              label: option.value === ALL ? (language === 'bs' ? 'Svi prioriteti' : option.label)
                : option.value === PRIORITY.CRITICAL ? t('priority.critical')
                : option.value === PRIORITY.HIGH ? t('priority.high')
                : option.value === PRIORITY.MEDIUM ? t('priority.medium')
                : t('priority.low'),
            })),
          },
        ]}
        isFiltered={isFiltered}
        onClear={clearFilters}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.95fr)]">
        <DataTable<ReportRow>
          columns={[
            {
              key: 'name',
              header: t('nav.interventions'),
              render: (_value, row) => (
                <div className="min-w-0">
                  <p className="font-medium text-foreground">#{row.id}</p>
                  <p className="max-w-[18rem] truncate text-sm text-muted-foreground">
                    {row.name}
                  </p>
                </div>
              ),
            },
            { key: 'location', header: t('interventionDetail.location') },
            { key: 'categoryName', header: t('interventionDetail.category'), render: (value) => translateCategoryName(language, String(value)) },
            {
              key: 'priority',
              header: t('interventionDetail.priority'),
              render: (value) => <PriorityBadge priority={value as Priority} />,
            },
            {
              key: 'status',
              header: t('interventionDetail.status'),
              render: (value) => (
                <InterventionStatusBadge status={value as InterventionStatus} />
              ),
            },
            {
              key: 'report',
              header: t('nav.reports'),
              render: (_value, row) => (
                <Badge
                  variant={row.reportError ? 'destructive' : row.report ? 'default' : 'outline'}
                >
                  {getReportLabel(row, language)}
                </Badge>
              ),
            },
            {
              key: 'reportDate',
              header: language === 'bs' ? 'Spremljeno' : 'Saved',
              render: (_value, row) => formatDateTime(row.report?.reportDate, language),
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (_value, row) => (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    selectRow(row);
                  }}
                >
                  {language === 'bs' ? 'Pregled' : 'View'}
                </Button>
              ),
            },
          ]}
          data={filteredRows}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          error={error}
          onRetry={loadData}
          onRowClick={selectRow}
          emptyTitle={language === 'bs' ? 'Nema izvještaja za odabrane filtere' : 'No reports match the filters'}
          emptyDescription={language === 'bs' ? 'Promijenite filtere ili osvježite pregled izvještaja.' : 'Adjust filters or refresh the reporting overview.'}
        />

        <ReportPreview
          row={selectedRow}
          isLoading={isLoading || (Boolean(selectedInterventionId) && isLoadingReports)}
          language={language}
        />
      </section>
    </PageLayout>
  );
}

function ReportPreview({
  row,
  isLoading,
  language,
}: {
  row: ReportRow | null;
  isLoading: boolean;
  language: LanguageCode;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{language === 'bs' ? 'Pregled izvještaja' : 'Report Preview'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!row) {
    return (
      <EmptyState
        title={language === 'bs' ? 'Odaberite intervenciju' : 'Select an intervention'}
        description={language === 'bs' ? 'Odaberite red iz pregleda izvještaja za pregled poslanog izvještaja.' : 'Choose a row from the report overview to inspect the submitted report.'}
      />
    );
  }

  if (row.reportError) {
    return (
      <EmptyState
        title={language === 'bs' ? 'Izvještaj nije dostupan' : 'Report unavailable'}
        description={row.reportError}
        action={{
          label: language === 'bs' ? 'Otvori intervenciju' : 'Open intervention',
          onClick: () => {
            window.location.href = ROUTES.INTERVENTION(row.id);
          },
        }}
      />
    );
  }

  return (
    <Card className="xl:sticky xl:top-24">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{language === 'bs' ? 'Intervencija' : 'Intervention'} #{row.id}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{row.name}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.INTERVENTION(row.id)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {language === 'bs' ? 'Otvori' : 'Open'}
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <InterventionStatusBadge status={row.status} />
          <PriorityBadge priority={row.priority} />
          <Badge variant={row.report ? 'default' : 'outline'}>
            {row.report ? (language === 'bs' ? 'Poslan' : 'Submitted') : (language === 'bs' ? 'Nedostaje' : 'Missing')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <InfoItem label={language === 'bs' ? 'Kompanija' : 'Company'} value={row.companyName} />
          <InfoItem label={language === 'bs' ? 'Kategorija' : 'Category'} value={translateCategoryName(language, row.categoryName)} />
          <InfoItem label={language === 'bs' ? 'Lokacija' : 'Location'} value={row.location} />
          <InfoItem label={language === 'bs' ? 'Odgovorna osoba' : 'Owner'} value={row.owner} />
          <InfoItem label={language === 'bs' ? 'Početak' : 'Started'} value={formatDateTime(row.startedAt, language)} />
          <InfoItem label={language === 'bs' ? 'Rok' : 'Due'} value={formatDateTime(row.dueAt, language)} />
        </div>

        {row.report ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground">Author</p>
              <p className="mt-1 font-medium">
                {row.report.author.firstName} {row.report.author.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'bs' ? 'Spremljeno' : 'Saved'} {formatDateTime(row.report.reportDate, language)}
              </p>
            </div>

            <ReportTextBlock label={language === 'bs' ? 'Opis rada' : 'Work Description'} value={row.report.description} />
            {row.report.materialItems && row.report.materialItems.length > 0 ? (
              <ReportTextBlock 
                label={language === 'bs' ? 'Korišteni materijali' : 'Materials Used'} 
                value={row.report.materialItems.map(item => `${item.name} (x${item.quantity})`).join(', ')} 
              />
            ) : null}
            {row.report.notes ? (
              <ReportTextBlock label={language === 'bs' ? 'Bilješke' : 'Notes'} value={row.report.notes} />
            ) : null}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            {language === 'bs' ? 'Ova intervencija još nema poslan izvještaj.' : 'This intervention does not have a submitted report yet.'}
          </p>
        )}
        <ReportFeedbackPreview interventionId={row.id} language={language} />
      </CardContent>
    </Card>
  );
}

function ReportFeedbackPreview({
  interventionId,
  language,
}: {
  interventionId: string;
  language: LanguageCode;
}) {
  const [feedback, setFeedback] = useState<InterventionFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadFeedback = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getInterventionFeedback(interventionId);
        if (!cancelled) setFeedback(data);
      } catch (requestError) {
        if (!cancelled) {
          setFeedback(null);
          setError(requestError instanceof Error ? requestError.message : 'Failed to load feedback.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadFeedback();

    return () => {
      cancelled = true;
    };
  }, [interventionId]);

  return (
    <section className="rounded-lg border bg-background p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">
            {language === 'bs' ? 'Feedback korisnika' : 'User feedback'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {language === 'bs' ? 'Ocjena vezana za ovu intervenciju' : 'Rating attached to this intervention'}
          </p>
        </div>
        {feedback ? (
          <Badge variant={feedback.rating <= 2 ? 'destructive' : 'default'}>
            {feedback.rating}/5
          </Badge>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {language === 'bs' ? 'Feedback nije dostupan za ovu intervenciju.' : 'Feedback is not available for this intervention.'}
        </p>
      ) : feedback ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="flex gap-0.5" aria-label={`${feedback.rating}/5`}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  className={
                    value <= feedback.rating
                      ? 'size-4 fill-primary text-primary'
                      : 'size-4 text-muted-foreground/50'
                  }
                />
              ))}
            </div>
            <span className="font-medium">
              {feedback.user.firstName} {feedback.user.lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(feedback.createdAt, language)}
            </span>
          </div>
          <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">
            {feedback.comment || (language === 'bs' ? 'Bez komentara.' : 'No comment.')}
          </p>
        </div>
      ) : (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {language === 'bs' ? 'Ova intervencija jos nema feedback.' : 'This intervention has no feedback yet.'}
        </p>
      )}
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '-'}</p>
    </div>
  );
}

function ReportTextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}
