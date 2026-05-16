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
import {
  TICKET_CATEGORIES,
  createTicket,
  getUserTickets,
  type TicketListItem,
  type TicketStatus,
} from '@/services/tickets.service';

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const STATUS_VARIANTS: Record<TicketStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OPEN: 'default',
  IN_PROGRESS: 'secondary',
  RESOLVED: 'outline',
  CLOSED: 'outline',
};

const ADMIN_ROLE_NAMES = new Set(['admin', 'administrator']);
const SUPPORT_AGENT_ROLE_NAMES = new Set(['supportagent', 'agentpodrske']);

function decodeJwtPayload(token: string): {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
} | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

function getSessionRoles(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const roles = new Set<string>();
  const rawUser = window.localStorage.getItem('user');
  const token = window.localStorage.getItem('token');

  try {
    const user = rawUser ? (JSON.parse(rawUser) as { role?: string; roles?: string[] }) : null;
    if (user?.role) {
      roles.add(user.role.toLowerCase());
    }
    user?.roles?.forEach((role) => roles.add(role.toLowerCase()));
  } catch {
    // Ignore malformed local session data and rely on the token roles below.
  }

  if (token) {
    const payload = decodeJwtPayload(token);
    payload?.realm_access?.roles?.forEach((role) => roles.add(role.toLowerCase()));
    Object.values(payload?.resource_access ?? {}).forEach((clientAccess) => {
      clientAccess.roles?.forEach((role) => roles.add(role.toLowerCase()));
    });
  }

  return Array.from(roles);
}

function TicketStatusBadge({ status, blocked }: { status: TicketStatus; blocked?: boolean }) {
  if (blocked) {
    return <Badge variant="destructive">Blocked</Badge>;
  }

  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

interface CreateTicketFormState {
  title: string;
  category: string;
  message: string;
}

const INITIAL_FORM: CreateTicketFormState = { title: '', category: '', message: '' };

function TicketsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateTicketFormState>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionRoles, setSessionRoles] = useState<string[]>([]);

  const canCreateTicket = useMemo(() => {
    const isSupportAgent = sessionRoles.some((role) => SUPPORT_AGENT_ROLE_NAMES.has(role));
    const isAdmin = sessionRoles.some((role) => ADMIN_ROLE_NAMES.has(role));

    return !isSupportAgent || isAdmin;
  }, [sessionRoles]);

  useEffect(() => {
    setSessionRoles(getSessionRoles());
    void loadTickets();
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
      setError('Unable to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(field: keyof CreateTicketFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim() || form.title.trim().length < 3) {
      setFormError('Title must be at least 3 characters.');
      return;
    }

    if (!form.category) {
      setFormError('Select a request category.');
      return;
    }

    if (!form.message.trim()) {
      setFormError('Problem description is required.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const newTicket = await createTicket({
        title: form.title.trim(),
        category: form.category,
        message: form.message.trim(),
      });
      setTickets((prev) => [newTicket, ...prev]);
      setForm(INITIAL_FORM);
      setDialogOpen(false);
    } catch {
      setFormError('Unable to create ticket. Please try again.');
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
        title="Support Tickets"
        subtitle="Track your support requests."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Tickets' }]}
        primaryAction={
          canCreateTicket
            ? {
                label: 'New ticket',
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
            <DialogTitle>Create support ticket</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4 pt-2">
            {formError ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {formError}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="ticket-title">Title</Label>
              <Input
                id="ticket-title"
                placeholder="Short problem summary..."
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                maxLength={150}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ticket-category">Request category</Label>
              <Select value={form.category} onValueChange={(value) => handleFormChange('category', value ?? '')}>
                <SelectTrigger id="ticket-category">
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ticket-message">Problem description</Label>
              <Textarea
                id="ticket-message"
                placeholder="Describe the problem or question in detail..."
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
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create ticket'}
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
          title="No tickets"
          description={
            canCreateTicket
              ? 'Create a ticket to ask a question or report a problem.'
              : 'There are no open tickets to process right now.'
          }
          action={
            canCreateTicket
              ? {
                  label: 'New ticket',
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
                    <p className="text-xs text-muted-foreground mt-0.5">{ticket.category}</p>
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
