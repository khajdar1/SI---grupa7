'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Plus, Ticket } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, PageHeader, PageLayout } from '@/components/shared';
import { ROUTES } from '@/constants';
import { getSessionRoles } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import {
  createTicket,
  getTicketCategories,
  getUserTickets,
  type TicketCategory,
  type TicketListItem,
  type TicketStatus,
} from '@/services/tickets.service';

const STATUS_VARIANTS: Record<TicketStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OPEN: 'default',
  IN_PROGRESS: 'secondary',
  RESOLVED: 'outline',
  CLOSED: 'outline',
};

const ADMIN_ROLE_NAMES = new Set(['admin', 'administrator']);
const SUPPORT_AGENT_ROLE_NAMES = new Set(['supportagent', 'agentpodrske']);

function TicketStatusBadge({ status, blocked }: { status: TicketStatus; blocked?: boolean }) {
  const { t } = useI18n();

  if (blocked) {
    return <Badge variant="destructive">{t('tickets.blocked')}</Badge>;
  }

  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {getStatusLabel(status, t)}
    </Badge>
  );
}

function getStatusLabel(status: TicketStatus, t: ReturnType<typeof useI18n>['t']): string {
  if (status === 'OPEN') return t('status.open');
  if (status === 'IN_PROGRESS') return t('status.inProgress');
  if (status === 'RESOLVED') return t('status.resolved');
  return t('status.closed');
}

interface CreateTicketFormState {
  title: string;
  categoryId: string;
  message: string;
}

const INITIAL_FORM: CreateTicketFormState = { title: '', categoryId: '', message: '' };

function TicketsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateTicketFormState>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const canCreateTicket = useMemo(() => {
    const sessionRoles = getSessionRoles();
    const isSupportAgent = Array.from(sessionRoles).some((role) => SUPPORT_AGENT_ROLE_NAMES.has(role));
    const isAdmin = Array.from(sessionRoles).some((role) => ADMIN_ROLE_NAMES.has(role));

    return !isSupportAgent || isAdmin;
  }, []);

  useEffect(() => {
    void loadTickets();
    void loadTicketCategories();
  }, []);

  useEffect(() => {
    if (searchParams.get('create') !== '1') {
      return;
    }

    if (canCreateTicket) {
      setDialogOpen(true);
      return;
    }

    router.replace(ROUTES.TICKETS, { scroll: false });
  }, [canCreateTicket, router, searchParams]);

  async function loadTickets() {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserTickets();
      setTickets(data);
    } catch {
      setError(t('tickets.loadError'));
    } finally {
      setLoading(false);
    }
  }

  async function loadTicketCategories() {
    try {
      const data = await getTicketCategories();
      setTicketCategories(data);
    } catch {
      setTicketCategories([]);
    }
  }

  function handleFormChange(field: keyof CreateTicketFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim() || form.title.trim().length < 3) {
      setFormError(t('tickets.titleMin'));
      return;
    }

    const categoryId = Number(form.categoryId);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      setFormError(t('tickets.categoryRequired'));
      return;
    }

    if (!form.message.trim()) {
      setFormError(t('tickets.descriptionRequired'));
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const newTicket = await createTicket({
        title: form.title.trim(),
        categoryId,
        message: form.message.trim(),
      });
      setTickets((prev) => [newTicket, ...prev]);
      setForm(INITIAL_FORM);
      setDialogOpen(false);
    } catch {
      setFormError(t('tickets.createError'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setForm(INITIAL_FORM);
      setFormError(null);
      if (searchParams.get('create') === '1') {
        router.replace(ROUTES.TICKETS, { scroll: false });
      }
    }
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={t('tickets.title')}
        subtitle={t('tickets.subtitle')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: ROUTES.DASHBOARD }, { label: t('tickets.breadcrumb') }]}
        primaryAction={
          canCreateTicket
            ? {
                label: t('tickets.newTicket'),
                onClick: () => setDialogOpen(true),
                icon: <Plus className="size-4" />,
              }
            : undefined
        }
      />

      {canCreateTicket ? (
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('tickets.createTitle')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4 pt-2">
            {formError ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {formError}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="ticket-title">{t('tickets.fieldTitle')}</Label>
              <Input
                id="ticket-title"
                placeholder={t('tickets.titlePlaceholder')}
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                maxLength={150}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ticket-category">{t('tickets.requestCategory')}</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) => handleFormChange('categoryId', value ?? '')}
                disabled={ticketCategories.length === 0}
              >
                <SelectTrigger id="ticket-category">
                  <SelectValue>
                    {ticketCategories.find((c) => String(c.id) === form.categoryId)?.name
                      ?? (ticketCategories.length === 0 ? t('tickets.noCategories') : t('tickets.selectCategory'))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ticketCategories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ticket-message">{t('tickets.problemDescription')}</Label>
              <Textarea
                id="ticket-message"
                placeholder={t('tickets.problemPlaceholder')}
                value={form.message}
                onChange={(e) => handleFormChange('message', e.target.value)}
                rows={5}
                maxLength={2000}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
                disabled={submitting}
              >
                {t('tickets.cancel')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? t('tickets.creating') : t('tickets.create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          title={t('tickets.noTickets')}
          description={
            canCreateTicket
              ? t('tickets.emptyUser')
              : t('tickets.emptyAgent')
          }
          action={
            canCreateTicket
              ? {
                  label: t('tickets.newTicket'),
                  onClick: () => setDialogOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => router.push(`${ROUTES.TICKETS}/${ticket.id}`)}
              className="glass-card w-full rounded-xl p-4 text-left transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Ticket className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-sm">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ticket.category}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <TicketStatusBadge status={ticket.status} blocked={ticket.userBlocked} />
                  <span className="text-xs text-muted-foreground">
                    #{ticket.id}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </PageLayout>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={null}>
      <TicketsPageContent />
    </Suspense>
  );
}
