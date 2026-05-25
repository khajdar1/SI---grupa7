'use client';
export const runtime = 'edge';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, Clock, Lock, Send, ShieldAlert, Ticket, Unlock, UserCircle, UserX } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { translateText, useI18n } from '@/lib/i18n';
import { socket } from '@/lib/socket';
import {
  addTicketMessage,
  blockTicketUser,
  getTicketById,
  getTicketAdminCandidates,
  requestTicketAdminReview,
  unblockTicketUser,
  updateTicketStatus,
  type TicketAdminCandidate,
  type TicketDetail,
  type TicketMessage,
  type TicketStatus,
} from '@/services/tickets.service';

const STATUS_VARIANTS: Record<TicketStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OPEN: 'default',
  IN_PROGRESS: 'secondary',
  RESOLVED: 'outline',
  CLOSED: 'outline',
};

const SUPPORT_AGENT_ROLES = new Set(['supportagent', 'agentpodrske']);
const ADMIN_ROLES = new Set(['admin', 'administrator']);

function getStatusLabel(status: TicketStatus, t: ReturnType<typeof useI18n>['t']): string {
  if (status === 'OPEN') return t('status.open');
  if (status === 'IN_PROGRESS') return t('status.inProgress');
  if (status === 'RESOLVED') return t('status.resolved');
  return t('status.closed');
}

type TicketMessageCreatedEvent = {
  ticketId: number;
  message: TicketMessage;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('hr', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCurrentUserId(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawUser = window.localStorage.getItem('user');
    if (!rawUser) {
      return null;
    }

    const parsed = JSON.parse(rawUser) as { id?: unknown };
    return typeof parsed.id === 'number' ? parsed.id : Number(parsed.id) || null;
  } catch {
    return null;
  }
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const { language, t } = useI18n();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewAdminId, setReviewAdminId] = useState('');
  const [reviewAdmins, setReviewAdmins] = useState<TicketAdminCandidate[]>([]);
  const [reviewAdminsLoading, setReviewAdminsLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockError, setBlockError] = useState<string | null>(null);
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [unblockSubmitting, setUnblockSubmitting] = useState(false);
  const [blockedUserLabel, setBlockedUserLabel] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSupportAgent = hasSessionRole(SUPPORT_AGENT_ROLES);
  const isAdmin = hasSessionRole(ADMIN_ROLES);
  const canManageTicket = isSupportAgent || isAdmin;
  const isTicketUserBlocked = Boolean(blockedUserLabel) || ticket?.userBlocked === true;

  function appendTicketMessage(message: TicketMessage) {
    setTicket((previous) => {
      if (!previous || previous.messages.some((existing) => existing.id === message.id)) {
        return previous;
      }

      return {
        ...previous,
        messages: [...previous.messages, message],
      };
    });
  }

  useEffect(() => {
    void loadTicket();
  }, [ticketId]);

  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
  }, []);

  useEffect(() => {
    if (!currentUserId || !Number.isInteger(ticketId) || ticketId <= 0) {
      return;
    }

    socket.connect();
    socket.emit('user:join', currentUserId);
    socket.emit('ticket:join', { ticketId, userId: currentUserId });

    return () => {
      socket.emit('ticket:leave', { ticketId, userId: currentUserId });
    };
  }, [currentUserId, ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages.length]);

  useEffect(() => {
    const handleStatusChanged = (updated: { id: number; status: TicketStatus; updatedAt?: string }) => {
      if (updated.id !== ticketId) {
        return;
      }

      setTicket((previous) =>
        previous
          ? {
              ...previous,
              status: updated.status,
              updatedAt: updated.updatedAt ?? previous.updatedAt,
            }
          : previous,
      );
    };

    const handleMessageCreated = (event: TicketMessageCreatedEvent) => {
      if (event.ticketId !== ticketId) {
        return;
      }

      appendTicketMessage(event.message);
    };

    socket.on('ticket:statusChanged', handleStatusChanged);
    socket.on('ticket:messageCreated', handleMessageCreated);

    return () => {
      socket.off('ticket:statusChanged', handleStatusChanged);
      socket.off('ticket:messageCreated', handleMessageCreated);
    };
  }, [ticketId]);

  useEffect(() => {
    if (!reviewDialogOpen || !isSupportAgent) {
      return;
    }

    async function loadAdmins() {
      try {
        setReviewAdminsLoading(true);
        setReviewError(null);
        const admins = await getTicketAdminCandidates();
        setReviewAdmins(admins);
        setReviewAdminId((current) => current || (admins[0]?.id ? String(admins[0].id) : ''));
      } catch {
        setReviewError(t('tickets.loadAdminsError'));
      } finally {
        setReviewAdminsLoading(false);
      }
    }

    void loadAdmins();
  }, [isSupportAgent, reviewDialogOpen, t]);

  async function loadTicket() {
    try {
      setLoading(true);
      setError(null);
      const data = await getTicketById(ticketId);
      setTicket(data);
    } catch {
      setError(t('tickets.loadError'));
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
      appendTicketMessage(msg);
      setMessageText('');
    } catch (requestError) {
      setSendError(requestError instanceof Error ? translateText(language, requestError.message) : t('tickets.messageSendError'));
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

  async function handleRequestAdminReview(e: React.FormEvent) {
    e.preventDefault();

    const adminUserId = Number(reviewAdminId);
    if (!Number.isInteger(adminUserId) || adminUserId <= 0) {
      setReviewError(t('tickets.selectAdminError'));
      return;
    }

    if (reviewReason.trim().length < 10) {
      setReviewError(t('tickets.reviewReasonMin'));
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError(null);
      await requestTicketAdminReview(ticketId, { adminUserId, reason: reviewReason.trim() });
      setReviewReason('');
      setReviewAdminId('');
      setReviewDialogOpen(false);
    } catch {
      setReviewError(t('tickets.reviewSendError'));
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleBlockTicketUser(e: React.FormEvent) {
    e.preventDefault();

    if (blockReason.trim().length < 10) {
      setBlockError(t('tickets.blockReasonMin'));
      return;
    }

    try {
      setBlockSubmitting(true);
      setBlockError(null);
      const blocked = await blockTicketUser(ticketId, { reason: blockReason.trim() });
      setBlockedUserLabel(blocked.username);
      setTicket((prev) => (prev ? { ...prev, userBlocked: blocked.ticketUserBlocked } : prev));
      setBlockReason('');
      setBlockDialogOpen(false);
    } catch {
      setBlockError(t('tickets.blockError'));
    } finally {
      setBlockSubmitting(false);
    }
  }

  async function handleUnblockTicketUser() {
    try {
      setUnblockSubmitting(true);
      setSendError(null);
      const unblocked = await unblockTicketUser(ticketId);
      setBlockedUserLabel(null);
      setTicket((prev) => (prev ? { ...prev, userBlocked: unblocked.ticketUserBlocked } : prev));
    } catch (requestError) {
      setSendError(requestError instanceof Error ? translateText(language, requestError.message) : t('tickets.unblockError'));
    } finally {
      setUnblockSubmitting(false);
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
          title={t('tickets.ticket')}
          breadcrumbs={[
            { label: t('nav.dashboard'), href: ROUTES.DASHBOARD },
            { label: t('tickets.breadcrumb'), href: ROUTES.TICKETS },
            { label: t('tickets.error') },
          ]}
        />
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error ?? t('tickets.notFound')}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={ticket.title}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: ROUTES.DASHBOARD },
          { label: t('tickets.breadcrumb'), href: ROUTES.TICKETS },
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
          <span className="text-xs text-muted-foreground">{t('tickets.status')}</span>
          <Badge variant={STATUS_VARIANTS[ticket.status]}>{getStatusLabel(ticket.status, t)}</Badge>
        </div>
        {isTicketUserBlocked ? <Badge variant="destructive">{t('tickets.blockedOnTicket')}</Badge> : null}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{t('tickets.category')}</span>
          <span className="font-medium text-foreground">{ticket.category}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span>{formatDate(ticket.createdAt)}</span>
        </div>
        {canManageTicket && ticket.status !== 'CLOSED' ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('tickets.changeStatus')}</span>
            <Select
              value={ticket.status}
              onValueChange={handleStatusChange}
              disabled={statusUpdating}
            >
              <SelectTrigger className="h-7 w-36 text-xs">
                <span className="flex-1 text-left">{getStatusLabel(ticket.status, t)}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">{t('status.open')}</SelectItem>
                <SelectItem value="IN_PROGRESS">{t('status.inProgress')}</SelectItem>
                <SelectItem value="RESOLVED">{t('status.resolved')}</SelectItem>
                <SelectItem value="CLOSED">{t('status.closed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {isSupportAgent ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={canManageTicket && ticket.status !== 'CLOSED' ? '' : 'ml-auto'}
            onClick={() => setReviewDialogOpen(true)}
          >
            <ShieldAlert className="size-3.5" />
            {t('tickets.adminReview')}
          </Button>
        ) : null}
        {isAdmin && currentUserId !== ticket.userId && !isTicketUserBlocked ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={blockSubmitting}
            onClick={() => setBlockDialogOpen(true)}
          >
            <UserX className="size-3.5" />
            {t('tickets.blockOnTicket')}
          </Button>
        ) : null}
        {isAdmin && currentUserId !== ticket.userId && isTicketUserBlocked ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={unblockSubmitting}
            onClick={handleUnblockTicketUser}
          >
            <Unlock className="size-3.5" />
            {unblockSubmitting ? t('tickets.unblocking') : t('tickets.unblockOnTicket')}
          </Button>
        ) : null}
      </div>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t('tickets.requestAdminReview')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRequestAdminReview} className="space-y-4 pt-2">
            {reviewError ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {reviewError}
              </div>
            ) : null}
            <Select
              value={reviewAdminId}
              onValueChange={(value) => {
                setReviewAdminId(value ?? '');
                setReviewError(null);
              }}
              disabled={reviewAdminsLoading || reviewAdmins.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {reviewAdminsLoading ? t('tickets.loadingAdmins') : (() => {
                    const a = reviewAdmins.find((admin) => String(admin.id) === reviewAdminId);
                    return a ? (`${a.firstName} ${a.lastName}`.trim() || a.username) + ` - ${a.email}` : t('tickets.selectAdmin');
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {reviewAdmins.map((admin) => (
                  <SelectItem key={admin.id} value={String(admin.id)}>
                    {`${admin.firstName} ${admin.lastName}`.trim() || admin.username} - {admin.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={reviewReason}
              onChange={(event) => {
                setReviewReason(event.target.value);
                setReviewError(null);
              }}
              rows={4}
              maxLength={1000}
              placeholder={t('tickets.reviewPlaceholder')}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={reviewSubmitting}
                onClick={() => setReviewDialogOpen(false)}
              >
                {t('tickets.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={reviewSubmitting || reviewAdminsLoading || !reviewAdminId}
              >
                {reviewSubmitting ? t('tickets.sending') : t('tickets.sendToAdmin')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t('tickets.blockUserTitle')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleBlockTicketUser} className="space-y-4 pt-2">
            {blockError ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {blockError}
              </div>
            ) : null}
            <Textarea
              value={blockReason}
              onChange={(event) => {
                setBlockReason(event.target.value);
                setBlockError(null);
              }}
              rows={4}
              maxLength={1000}
              placeholder={t('tickets.blockPlaceholder')}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={blockSubmitting}
                onClick={() => setBlockDialogOpen(false)}
              >
                {t('tickets.cancel')}
              </Button>
              <Button type="submit" variant="destructive" disabled={blockSubmitting}>
                {blockSubmitting ? t('tickets.blocking') : t('tickets.block')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="glass-card flex h-[min(72vh,720px)] min-h-[520px] flex-col overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b bg-white/70 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t('tickets.conversation')}</h2>
            <p className="text-xs text-muted-foreground">
              {ticket.status === 'CLOSED' ? t('tickets.closedTicket') : t('tickets.activeTicket')}
            </p>
          </div>
          <Badge variant={STATUS_VARIANTS[ticket.status]}>{getStatusLabel(ticket.status, t)}</Badge>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4">
          {ticket.messages.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t('tickets.noMessages')}</p>
          ) : (
            ticket.messages.map((msg) => {
              const isMine = currentUserId !== null && msg.author.id === currentUserId;
              const authorName = `${msg.author.firstName} ${msg.author.lastName}`.trim() || 'User';

              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {!isMine ? (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm ring-1 ring-slate-200">
                      <UserCircle className="size-4" />
                    </div>
                  ) : null}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isMine
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md border border-slate-200 bg-white text-foreground'
                    }`}
                  >
                    <div
                      className={`mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] ${
                        isMine ? 'text-primary-foreground/75' : 'text-muted-foreground'
                      }`}
                    >
                      <span className="font-semibold">{authorName}</span>
                      <span>{formatDate(msg.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                  </div>
                  {isMine ? (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                      <UserCircle className="size-4" />
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {isTicketUserBlocked ? (
          <div className="flex items-center justify-center gap-2 border-t bg-white p-4 text-center text-sm text-muted-foreground">
            <Lock className="size-4" />
            {t('tickets.blockedNoMessages')}
          </div>
        ) : ticket.status !== 'CLOSED' ? (
          <form onSubmit={handleSendMessage} className="space-y-2 border-t bg-white p-4">
            {sendError ? (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {sendError}
              </div>
            ) : null}
            <div className="flex items-end gap-2 rounded-2xl border bg-slate-50/80 p-2">
              <Textarea
                placeholder={t('tickets.writeMessage')}
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  setSendError(null);
                }}
                rows={2}
                maxLength={2000}
                className="min-h-[52px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
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
                className="h-10 shrink-0 gap-1.5 rounded-xl px-4"
              >
                <Send className="size-3.5" />
                {sending ? t('tickets.sending') : t('tickets.send')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('tickets.sendHint')}</p>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 border-t bg-white p-4 text-center text-sm text-muted-foreground">
            <Lock className="size-4" />
            {t('tickets.closedNoMessages')}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
