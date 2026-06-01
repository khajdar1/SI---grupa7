'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, BarChart2, CheckCircle2, Clock, Package, RefreshCw, ShieldAlert, TrendingUp, Wrench } from 'lucide-react';

import { AccessDenied, PageHeader, PageLayout, StatCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants';
import { translatePriority, translateText, useI18n } from '@/lib/i18n';
import {
  getManagementDashboard,
  type ManagementDashboardStats,
  type Priority,
} from '@/services/management.service';
import {
  getAllEscalations,
  reviewEscalation,
  type Escalation,
} from '@/services/escalations.service';

const MANAGEMENT_ROLES = new Set(['menadzment', 'management', 'admin', 'administrator']);

const PRIORITY_LABELS: Record<Priority, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

const PRIORITY_BADGE_CLASS: Record<Priority, string> = {
  CRITICAL: 'bg-rose-100 text-rose-700 border-rose-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

function getTokenRoles(token: string): string[] {
  try {
    const payload = JSON.parse(
      window.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    ) as {
      realm_access?: { roles?: string[] };
      resource_access?: Record<string, { roles?: string[] }>;
    };
    const realmRoles = payload.realm_access?.roles ?? [];
    const clientRoles = Object.values(payload.resource_access ?? {}).flatMap((a) => a.roles ?? []);
    return [...realmRoles, ...clientRoles].map((r) => r.toLowerCase());
  } catch {
    return [];
  }
}

function hasManagementAccess(): boolean {
  if (typeof window === 'undefined') return false;
  const token = window.localStorage.getItem('token');
  if (!token) return false;
  return getTokenRoles(token).some((r) => MANAGEMENT_ROLES.has(r));
}

function formatHours(hours: number | null): string {
  if (hours === null) return '-';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours.toFixed(1)} h`;
}

function PriorityTableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function ManagementDashboardPage() {
  const { language, t } = useI18n();
  const [authorized, setAuthorized] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<ManagementDashboardStats | null>(null);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [escalationsLoading, setEscalationsLoading] = useState(false);
  const [includeReviewed, setIncludeReviewed] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getManagementDashboard();
      setStats(data);
    } catch (err) {
      setError(translateText(language, err instanceof Error ? err.message : 'Failed to load data.'));
    } finally {
      setLoading(false);
    }
  };

  const loadEscalations = async (withReviewed: boolean) => {
    setEscalationsLoading(true);
    try {
      const data = await getAllEscalations(withReviewed);
      setEscalations(data);
    } catch {
      // non-critical
    } finally {
      setEscalationsLoading(false);
    }
  };

  const handleReview = async (escalationId: number) => {
    setReviewingId(escalationId);
    try {
      const updated = await reviewEscalation(escalationId);
      setEscalations((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch {
      // silently fail
    } finally {
      setReviewingId(null);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    const canView = hasManagementAccess();
    setAuthorized(canView);
    setIsGuest(!token);

    if (canView) {
      void loadStats();
      void loadEscalations(false);
    } else {
      setLoading(false);
    }
  }, []);

  if (!authorized) {
    return (
      <AccessDenied
        reason={isGuest ? 'unauthenticated' : 'unauthorized'}
        requiredRole="Management / Admin"
      />
    );
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={language === 'bs' ? 'Menadžment kontrolna ploča' : 'Management Dashboard'}
        subtitle={language === 'bs' ? 'Pregled ključnih metrika sistema intervencija.' : 'Overview of key intervention system metrics.'}
        breadcrumbs={[{ label: t('nav.dashboard'), href: ROUTES.DASHBOARD }, { label: language === 'bs' ? 'Menadžment kontrolna ploča' : 'Management Dashboard' }]}
        primaryAction={{
          label: t('dashboard.refresh'),
          onClick: () => void loadStats(),
          variant: 'outline',
          icon: <RefreshCw className="mr-1.5 size-4" aria-hidden="true" />,
          isLoading: loading,
        }}
      />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end">
        <Button asChild className="gap-2 shadow-sm">
          <Link href={ROUTES.MANAGEMENT_MATERIALS ?? '/management/materials'}>
            <Package className="size-4" aria-hidden="true" />
            {language === 'bs' ? 'Potrošnja materijala' : 'Material Consumption'}
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Statistics">
        <StatCard
          title={language === 'bs' ? 'Aktivne intervencije' : 'Active Interventions'}
          value={stats?.activeCount ?? 0}
          icon={<Wrench className="size-5 text-primary" aria-hidden="true" />}
          isLoading={loading}
        />
        <StatCard
          title={language === 'bs' ? 'Završene intervencije' : 'Completed Interventions'}
          value={stats?.completedCount ?? 0}
          icon={<CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />}
          isLoading={loading}
        />
        <StatCard
          title={language === 'bs' ? 'Prosj. vrijeme rješavanja' : 'Avg. Resolution Time'}
          value={stats ? formatHours(stats.averageResolutionHours) : '-'}
          icon={<Clock className="size-5 text-violet-500" aria-hidden="true" />}
          isLoading={loading}
        />
      </section>

      {/* Priority distribution table */}
      <Card className="stat-card-glow rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur-sm shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="icon-bg-purple flex size-10 items-center justify-center rounded-xl">
            <BarChart2 className="size-5 text-purple-600" aria-hidden="true" />
          </div>
          <CardTitle className="text-base font-bold">{language === 'bs' ? 'Distribucija prioriteta' : 'Priority Distribution'}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <PriorityTableSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label={language === 'bs' ? 'Distribucija intervencija po prioritetu' : 'Intervention distribution by priority'}>
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pr-4">{t('interventionDetail.priority')}</th>
                    <th className="pb-3 px-4 text-right">{language === 'bs' ? 'Ukupno' : 'Total'}</th>
                    <th className="pb-3 px-4 text-right">{language === 'bs' ? 'Aktivno' : 'Active'}</th>
                    <th className="pb-3 pl-4 text-right">{language === 'bs' ? 'Završeno' : 'Completed'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats?.priorityDistribution.map((row) => (
                    <tr key={row.priority} className="group transition-colors hover:bg-slate-50/80">
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${PRIORITY_BADGE_CLASS[row.priority]}`}
                        >
                          <TrendingUp className="size-3" aria-hidden="true" />
                          {translatePriority(language, row.priority)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black tabular-nums">{row.total}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">
                        {row.active}
                      </td>
                      <td className="py-3 pl-4 text-right tabular-nums text-emerald-600 font-semibold">
                        {row.completed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escalations section */}
      <Card className="rounded-2xl border border-rose-200/60 bg-white/90 shadow-[0_2px_14px_rgba(15,23,42,0.05)]">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100">
              <ShieldAlert className="size-5 text-rose-600" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">
                {language === 'bs' ? 'Eskalacije' : 'Escalations'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {language === 'bs'
                  ? 'Intervencije eskalirane od strane koordinatora'
                  : 'Interventions escalated by coordinators'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={includeReviewed ? 'secondary' : 'outline'}
              onClick={() => {
                const next = !includeReviewed;
                setIncludeReviewed(next);
                void loadEscalations(next);
              }}
              className="text-xs"
            >
              {language === 'bs'
                ? includeReviewed
                  ? 'Sakrij pregledane'
                  : 'Prikaži sve'
                : includeReviewed
                  ? 'Hide reviewed'
                  : 'Show all'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {escalationsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : escalations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {language === 'bs'
                ? includeReviewed
                  ? 'Nema eskalacija.'
                  : 'Nema nepregledanih eskalacija.'
                : includeReviewed
                  ? 'No escalations found.'
                  : 'No unreviewed escalations.'}
            </p>
          ) : (
            <div className="space-y-3">
              {escalations.map((esc) => {
                const isReviewed = esc.reviewedAt !== null;
                const authorName = `${esc.escalatedBy.firstName} ${esc.escalatedBy.lastName}`;
                return (
                  <div
                    key={esc.id}
                    className="rounded-xl border border-rose-200/60 bg-rose-50/40 p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <Link
                          href={`/interventions/${esc.intervention?.id ?? esc.interventionId}`}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          {esc.intervention?.name ?? `Intervention #${esc.interventionId}`}
                        </Link>
                        {esc.intervention && (
                          <p className="text-xs text-muted-foreground">
                            {esc.intervention.company.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isReviewed ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                            <CheckCircle2 className="size-3" aria-hidden="true" />
                            {language === 'bs' ? 'Pregledano' : 'Reviewed'}
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                            <Clock className="size-3" aria-hidden="true" />
                            {language === 'bs' ? 'Na čekanju' : 'Pending'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <AlertTriangle className="size-4 text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
                      <p className="text-sm font-medium text-rose-700">{esc.reason}</p>
                    </div>

                    <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-wrap">
                      {esc.comment}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {language === 'bs' ? 'Eskalirao' : 'By'}: <strong>{authorName}</strong>
                        {' — '}
                        {new Date(esc.createdAt).toLocaleString(
                          language === 'bs' ? 'bs-BA' : 'en-US',
                        )}
                      </span>

                      {!isReviewed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleReview(esc.id)}
                          disabled={reviewingId === esc.id}
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-7 text-xs"
                        >
                          <CheckCircle2 className="mr-1 size-3" aria-hidden="true" />
                          {reviewingId === esc.id
                            ? language === 'bs'
                              ? 'Označavanje...'
                              : 'Marking...'
                            : language === 'bs'
                              ? 'Označi kao pregledano'
                              : 'Mark Reviewed'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}