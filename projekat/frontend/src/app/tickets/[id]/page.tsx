'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, Clock, Send, Ticket } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader, PageLayout } from '@/components/shared';
import { ROUTES } from '@/constants';
import { hasSessionRole } from '@/lib/auth';
import {
  addTicketMessage,
  getTicketById,
  updateTicketStatus,
  type TicketDetail,
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

const AGENT_ROLES = new Set(['admin', 'administrator', 'koordinator', 'coordinator']);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('hr', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAgent = hasSessionRole(AGENT_ROLES);

  useEffect(() => {
    void loadTicket();
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages.length]);

  async function loadTicket() {
    try {
      setLoading(true);
      setError(null);
      const data = await getTicketById(ticketId);
      setTicket(data);
    } catch {
      setError('Nije moguće učitati tiket. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setSending(true);
      setSendError(null);
      const msg = await addTicketMessage(ticketId, { text: messageText.trim() });
      setTicket((prev) => (prev ? { ...prev, messages: [...prev.messages, msg] } : prev));
      setMessageText('');
    } catch {
      setSendError('Slanje poruke nije uspjelo. Pokušajte ponovo.');
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(value: string | null) {
    if (!value || !ticket) return;
    try {
      setStatusUpdating(true);
      const updated = await updateTicketStatus(ticketId, value as TicketStatus);
      setTicket((prev) => (prev ? { ...prev, status: updated.status } : prev));
    } catch {
      // badge reflects real status on next load
    } finally {
      setStatusUpdating(false);
    }
  }

  if (loading) {
    return (
      <PageLayout className="space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-72 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </PageLayout>
    );
  }

  if (error || !ticket) {
    return (
      <PageLayout className="space-y-6">
        <PageHeader
          title="Tiket"
          breadcrumbs={[
            { label: 'Dashboard', href: ROUTES.DASHBOARD },
            { label: 'Tiketi', href: ROUTES.TICKETS },
            { label: 'Greška' },
          ]}
        />
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error ?? 'Tiket nije pronađen.'}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={ticket.title}
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Tiketi', href: ROUTES.TICKETS },
          { label: `#${ticket.id}` },
        ]}
      />

      {/* Ticket meta info */}
      <div className="glass-card flex flex-wrap items-center gap-4 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Ticket className="size-4 shrink-0 text-primary" />
          <span className="text-xs text-muted-foreground">#{ticket.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <Badge variant={STATUS_VARIANTS[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Kategorija:</span>
          <span className="font-medium text-foreground">{ticket.category}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span>{formatDate(ticket.createdAt)}</span>
        </div>
        {isAgent && ticket.status !== 'CLOSED' ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Promijeni status:</span>
            <Select
              value={ticket.status}
              onValueChange={handleStatusChange}
              disabled={statusUpdating}
            >
              <SelectTrigger className="h-7 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Otvoren</SelectItem>
                <SelectItem value="IN_PROGRESS">U tijeku</SelectItem>
                <SelectItem value="RESOLVED">Riješen</SelectItem>
                <SelectItem value="CLOSED">Zatvoren</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {/* Message thread */}
      <div className="glass-card flex flex-col overflow-hidden rounded-xl">
        <div className="max-h-[480px] flex-1 space-y-3 overflow-y-auto p-4">
          {ticket.messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nema poruka.</p>
          ) : (
            ticket.messages.map((msg) => (
              <div key={msg.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {msg.author.firstName} {msg.author.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">
                  {msg.text}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {ticket.status !== 'CLOSED' ? (
          <form onSubmit={handleSendMessage} className="space-y-2 border-t p-4">
            {sendError ? (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {sendError}
              </div>
            ) : null}
            <div className="flex gap-2">
              <Textarea
                placeholder="Napišite poruku..."
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  setSendError(null);
                }}
                rows={2}
                maxLength={2000}
                className="resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendMessage(e as unknown as React.FormEvent);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={sending || !messageText.trim()}
                size="sm"
                className="self-end gap-1.5"
              >
                <Send className="size-3.5" />
                {sending ? 'Slanje...' : 'Pošalji'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Enter = pošalji · Shift+Enter = novi red</p>
          </form>
        ) : (
          <div className="border-t p-4 text-center text-sm text-muted-foreground">
            Tiket je zatvoren. Nije moguće slati nove poruke.
          </div>
        )}
      </div>
    </PageLayout>
  );
}
