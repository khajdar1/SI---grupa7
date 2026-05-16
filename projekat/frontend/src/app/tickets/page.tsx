'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  OPEN: 'Otvoren',
  IN_PROGRESS: 'U tijeku',
  RESOLVED: 'Riješen',
  CLOSED: 'Zatvoren',
};

const STATUS_VARIANTS: Record<TicketStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OPEN: 'default',
  IN_PROGRESS: 'secondary',
  RESOLVED: 'outline',
  CLOSED: 'outline',
};

function TicketStatusBadge({ status }: { status: TicketStatus }) {
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

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateTicketFormState>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadTickets();
  }, []);

  async function loadTickets() {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserTickets();
      setTickets(data);
    } catch {
      setError('Nije moguće učitati tikete. Pokušajte ponovo.');
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
      setFormError('Naslov mora imati najmanje 3 karaktera.');
      return;
    }

    if (!form.category) {
      setFormError('Odaberite kategoriju upita.');
      return;
    }

    if (!form.message.trim()) {
      setFormError('Opis problema je obavezan.');
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
      setFormError('Kreiranje tiketa nije uspjelo. Pokušajte ponovo.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setForm(INITIAL_FORM);
      setFormError(null);
    }
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Tiketi za podršku"
        subtitle="Pratite vaše zahtjeve za korisničku podršku."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Tiketi' }]}
        primaryAction={{
          label: 'Novi tiket',
          onClick: () => setDialogOpen(true),
          icon: <Plus className="size-4" />,
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Kreiranje tiketa za podršku</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4 pt-2">
            {formError ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {formError}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="ticket-title">Naslov</Label>
              <Input
                id="ticket-title"
                placeholder="Kratki opis problema..."
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                maxLength={150}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ticket-category">Kategorija upita</Label>
              <Select value={form.category} onValueChange={(value) => handleFormChange('category', value ?? '')}>
                <SelectTrigger id="ticket-category">
                  <SelectValue placeholder="Odaberite kategoriju..." />
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
              <Label htmlFor="ticket-message">Opis problema</Label>
              <Textarea
                id="ticket-message"
                placeholder="Detaljno opišite problem ili pitanje..."
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
                Odustani
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Kreiranje...' : 'Kreiraj tiket'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
          title="Nemate tiketa"
          description="Kreirajte tiket kako biste postavili pitanje ili prijavili problem."
          action={{
            label: 'Novi tiket',
            onClick: () => setDialogOpen(true),
          }}
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
                  <TicketStatusBadge status={ticket.status} />
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
