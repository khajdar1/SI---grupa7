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

const ALL = 'ALL';
const WITH_REPORT = 'WITH_REPORT';
const WITHOUT_REPORT = 'WITHOUT_REPORT';
const UNKNOWN_REPORT = 'UNKNOWN_REPORT';

const STATUS_FILTERS = [
  { value: ALL, label: 'All statuses' },
  { value: INTERVENTION_STATUS.NEW, label: 'Open' },
  { value: INTERVENTION_STATUS.ASSIGNED, label: 'Assigned' },
  { value: INTERVENTION_STATUS.IN_PROGRESS, label: 'In progress' },
  { value: INTERVENTION_STATUS.RESOLVED, label: 'Resolved' },
  { value: INTERVENTION_STATUS.CANCELLED, label: 'Cancelled' },
  { value: INTERVENTION_STATUS.REJECTED, label: 'Rejected' },
];

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

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getReportLabel(row: ReportRow) {
  if (!row.isReportKnown) return 'Checking';
  if (row.reportError) return 'Unavailable';
  return row.report ? 'Submitted' : 'Missing';
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

export default function ReportsPage() {
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
        title="Reports"
        subtitle="Review submitted intervention reports and follow up on missing documentation."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Reports' }]}
        secondaryActions={[
          {
            label: 'History',
            href: ROUTES.HISTORY,
            variant: 'outline',
            icon: <Hourglass className="mr-2 h-4 w-4" />,
          },
        ]}
        primaryAction={{
          label: 'Refresh',
          onClick: loadData,
          isLoading: isLoading || isLoadingReports,
          icon: <BarChart2 className="mr-2 h-4 w-4" />,
        }}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Interventions"
          value={rows.length}
          isLoading={isLoading}
          icon={<ClipboardList className="size-5" />}
        />
        <StatCard
          title="Submitted reports"
          value={submittedCount}
          isLoading={isLoading || isLoadingReports}
          icon={<CheckCircle2 className="size-5" />}
        />
        <StatCard
          title="Missing reports"
          value={missingCount}
          isLoading={isLoading || isLoadingReports}
          icon={<FileText className="size-5" />}
        />
        <StatCard
          title="Selected"
          value={selectedInterventionId ? `#${selectedInterventionId}` : '-'}
          isLoading={isLoading}
          icon={<ExternalLink className="size-5" />}
        />
      </section>

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search intervention, location, owner...',
        }}
        filters={[
          {
            key: 'report-state',
            label: 'Report',
            value: selectedReportState,
            onChange: setSelectedReportState,
            options: REPORT_FILTERS,
          },
          {
            key: 'status',
            label: 'Status',
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: STATUS_FILTERS,
          },
          {
            key: 'priority',
            label: 'Priority',
            value: selectedPriority,
            onChange: setSelectedPriority,
            options: PRIORITY_FILTERS,
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
              header: 'Intervention',
              render: (_value, row) => (
                <div className="min-w-0">
                  <p className="font-medium text-foreground">#{row.id}</p>
                  <p className="max-w-[18rem] truncate text-sm text-muted-foreground">
                    {row.name}
                  </p>
                </div>
              ),
            },
            { key: 'location', header: 'Location' },
            { key: 'categoryName', header: 'Category' },
            {
              key: 'priority',
              header: 'Priority',
              render: (value) => <PriorityBadge priority={value as Priority} />,
            },
            {
              key: 'status',
              header: 'Status',
              render: (value) => (
                <InterventionStatusBadge status={value as InterventionStatus} />
              ),
            },
            {
              key: 'report',
              header: 'Report',
              render: (_value, row) => (
                <Badge
                  variant={row.reportError ? 'destructive' : row.report ? 'default' : 'outline'}
                >
                  {getReportLabel(row)}
                </Badge>
              ),
            },
            {
              key: 'reportDate',
              header: 'Saved',
              render: (_value, row) => formatDateTime(row.report?.reportDate),
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
                  View
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
          emptyTitle="No reports match the filters"
          emptyDescription="Adjust filters or refresh the reporting overview."
        />

        <ReportPreview
          row={selectedRow}
          isLoading={isLoading || (Boolean(selectedInterventionId) && isLoadingReports)}
        />
      </section>
    </PageLayout>
  );
}

function ReportPreview({
  row,
  isLoading,
}: {
  row: ReportRow | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
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
        title="Select an intervention"
        description="Choose a row from the report overview to inspect the submitted report."
      />
    );
  }

  if (row.reportError) {
    return (
      <EmptyState
        title="Report unavailable"
        description={row.reportError}
        action={{
          label: 'Open intervention',
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
            <CardTitle>Intervention #{row.id}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{row.name}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.INTERVENTION(row.id)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <InterventionStatusBadge status={row.status} />
          <PriorityBadge priority={row.priority} />
          <Badge variant={row.report ? 'default' : 'outline'}>
            {row.report ? 'Submitted' : 'Missing'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <InfoItem label="Company" value={row.companyName} />
          <InfoItem label="Category" value={row.categoryName} />
          <InfoItem label="Location" value={row.location} />
          <InfoItem label="Owner" value={row.owner} />
          <InfoItem label="Started" value={formatDateTime(row.startedAt)} />
          <InfoItem label="Due" value={formatDateTime(row.dueAt)} />
        </div>

        {row.report ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground">Author</p>
              <p className="mt-1 font-medium">
                {row.report.author.firstName} {row.report.author.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                Saved {formatDateTime(row.report.reportDate)}
              </p>
            </div>

            <ReportTextBlock label="Work Description" value={row.report.description} />
            {row.report.material ? (
              <ReportTextBlock label="Materials Used" value={row.report.material} />
            ) : null}
            {row.report.notes ? (
              <ReportTextBlock label="Notes" value={row.report.notes} />
            ) : null}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            This intervention does not have a submitted report yet.
          </p>
        )}
      </CardContent>
    </Card>
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
