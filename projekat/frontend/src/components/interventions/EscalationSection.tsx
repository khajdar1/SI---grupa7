'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  createEscalation,
  getEscalationsByIntervention,
  reviewEscalation,
  type Escalation,
} from '@/services/escalations.service';
import { useI18n } from '@/lib/i18n';

// ── auth helpers ────────────────────────────────────────────────────────────

type TokenPayload = {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
};

function decodeToken(token: string): TokenPayload | null {
  const [, payload] = token.split('.');
  if (!payload) return null;
  try {
    const norm = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = norm.padEnd(norm.length + ((4 - (norm.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded)) as TokenPayload;
  } catch {
    return null;
  }
}

function getSessionRoles(): string[] {
  if (typeof window === 'undefined') return [];
  const token = window.localStorage.getItem('token');
  if (!token) return [];
  const payload = decodeToken(token);
  if (!payload) return [];
  const realm = payload.realm_access?.roles ?? [];
  const client = Object.values(payload.resource_access ?? {}).flatMap((a) => a.roles ?? []);
  return [...realm, ...client].map((r) => r.toLowerCase());
}

const COORDINATOR_ROLES = new Set(['koordinator', 'coordinator', 'admin', 'administrator']);
const MANAGEMENT_ROLES = new Set(['menadzment', 'management', 'admin', 'administrator']);
const VIEW_ROLES = new Set([
  'koordinator',
  'coordinator',
  'menadzment',
  'management',
  'admin',
  'administrator',
]);

// ── sub-components ───────────────────────────────────────────────────────────

function EscalationCard({
  escalation,
  canReview,
  onReviewed,
  language,
}: {
  escalation: Escalation;
  canReview: boolean;
  onReviewed: (updated: Escalation) => void;
  language: string;
}) {
  const [reviewing, setReviewing] = useState(false);

  const handleReview = async () => {
    setReviewing(true);
    try {
      const updated = await reviewEscalation(escalation.id);
      onReviewed(updated);
    } catch {
      // silently fail — parent will handle if needed
    } finally {
      setReviewing(false);
    }
  };

  const isReviewed = escalation.reviewedAt !== null;
  const authorName = `${escalation.escalatedBy.firstName} ${escalation.escalatedBy.lastName}`;
  const reviewerName = escalation.reviewedBy
    ? `${escalation.reviewedBy.firstName} ${escalation.reviewedBy.lastName}`
    : null;
  const createdDate = new Date(escalation.createdAt).toLocaleString(
    language === 'bs' ? 'bs-BA' : 'en-US',
  );

  return (
    <div className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm font-semibold text-rose-700">{escalation.reason}</p>
        </div>
        {isReviewed ? (
          <Badge className="shrink-0 bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
            <CheckCircle2 className="size-3" aria-hidden="true" />
            {language === 'bs' ? 'Pregledano' : 'Reviewed'}
          </Badge>
        ) : (
          <Badge className="shrink-0 bg-amber-100 text-amber-700 border-amber-200 gap-1">
            <Clock className="size-3" aria-hidden="true" />
            {language === 'bs' ? 'Na čekanju' : 'Pending'}
          </Badge>
        )}
      </div>

      <p className="text-sm text-slate-700 whitespace-pre-wrap">{escalation.comment}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          {language === 'bs' ? 'Eskalirao' : 'Escalated by'}: <strong>{authorName}</strong>
        </span>
        <span>{createdDate}</span>
      </div>

      {isReviewed && reviewerName && (
        <p className="text-xs text-emerald-600">
          {language === 'bs' ? 'Pregledao' : 'Reviewed by'}: <strong>{reviewerName}</strong>
          {' — '}
          {new Date(escalation.reviewedAt!).toLocaleString(language === 'bs' ? 'bs-BA' : 'en-US')}
        </p>
      )}

      {!isReviewed && canReview && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => void handleReview()}
          disabled={reviewing}
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        >
          <CheckCircle2 className="mr-1.5 size-3.5" aria-hidden="true" />
          {reviewing
            ? language === 'bs'
              ? 'Označavanje...'
              : 'Marking...'
            : language === 'bs'
              ? 'Označi kao pregledano'
              : 'Mark as Reviewed'}
        </Button>
      )}
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────

interface EscalationSectionProps {
  interventionId: number;
}

export function EscalationSection({ interventionId }: EscalationSectionProps) {
  const { language } = useI18n();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const roles = getSessionRoles();
  const canView = roles.some((r) => VIEW_ROLES.has(r));
  const canEscalate = roles.some((r) => COORDINATOR_ROLES.has(r));
  const canReview = roles.some((r) => MANAGEMENT_ROLES.has(r));

  useEffect(() => {
    if (!canView) return;
    void loadEscalations();
  }, [interventionId, canView]);

  const loadEscalations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEscalationsByIntervention(interventionId);
      setEscalations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load escalations.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    const trimmedComment = comment.trim();

    if (trimmedReason.length < 5) {
      setSubmitError(
        language === 'bs'
          ? 'Razlog mora imati najmanje 5 karaktera.'
          : 'Reason must be at least 5 characters.',
      );
      return;
    }
    if (!trimmedComment) {
      setSubmitError(
        language === 'bs' ? 'Komentar je obavezan.' : 'Comment is required.',
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await createEscalation(interventionId, {
        reason: trimmedReason,
        comment: trimmedComment,
      });
      setEscalations((prev) => [...prev, created]);
      setDialogOpen(false);
      setReason('');
      setComment('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to escalate.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewed = (updated: Escalation) => {
    setEscalations((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  if (!canView) return null;

  const pendingCount = escalations.filter((e) => !e.reviewedAt).length;

  return (
    <>
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
              {pendingCount > 0 && (
                <p className="text-xs text-rose-600 font-medium">
                  {pendingCount}{' '}
                  {language === 'bs'
                    ? `${pendingCount === 1 ? 'nepregledana' : 'nepregledane'}`
                    : `${pendingCount === 1 ? 'unreviewed' : 'unreviewed'}`}
                </p>
              )}
            </div>
          </div>

          {canEscalate && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDialogOpen(true)}
              className="gap-1.5"
            >
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              {language === 'bs' ? 'Eskalirati' : 'Escalate'}
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : escalations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {language === 'bs'
                ? 'Nema eskalacija za ovu intervenciju.'
                : 'No escalations for this intervention.'}
            </p>
          ) : (
            escalations.map((e) => (
              <EscalationCard
                key={e.id}
                escalation={e}
                canReview={canReview}
                onReviewed={handleReviewed}
                language={language}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Create escalation dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setReason('');
            setComment('');
            setSubmitError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-rose-500" aria-hidden="true" />
              {language === 'bs' ? 'Eskalirati intervenciju' : 'Escalate Intervention'}
            </DialogTitle>
            <DialogDescription>
              {language === 'bs'
                ? 'Označite intervenciju kao rizičnu i obavijestite menadžment uz obavezan razlog.'
                : 'Mark the intervention as risky and notify management with a mandatory reason.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="escalation-reason">
                {language === 'bs' ? 'Razlog eskalacije *' : 'Escalation Reason *'}
              </Label>
              <Textarea
                id="escalation-reason"
                placeholder={
                  language === 'bs'
                    ? 'Navedite konkretan razlog eskalacije...'
                    : 'Specify the concrete reason for escalation...'
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="resize-none"
                rows={2}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">{reason.length}/1000</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="escalation-comment">
                {language === 'bs' ? 'Komentar za menadžment *' : 'Comment for Management *'}
              </Label>
              <Textarea
                id="escalation-comment"
                placeholder={
                  language === 'bs'
                    ? 'Detaljno opišite situaciju i šta zahtijeva pažnju menadžmenta...'
                    : 'Describe the situation and what requires management attention...'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
                rows={4}
                maxLength={5000}
              />
            </div>

            {submitError && (
              <p className="text-sm text-rose-600 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2">
                {submitError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {language === 'bs' ? 'Odustani' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting
                ? language === 'bs'
                  ? 'Eskaliranje...'
                  : 'Escalating...'
                : language === 'bs'
                  ? 'Eskalirati'
                  : 'Escalate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
