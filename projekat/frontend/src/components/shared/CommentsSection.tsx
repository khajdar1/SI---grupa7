'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getComments, createComment, type Comment } from '@/services/comments.service';

// ─── helpers ────────────────────────────────────────────────────────────────

type KeycloakTokenPayload = {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
};

function decodeTokenPayload(token: string): KeycloakTokenPayload | null {
  const [, payload] = token.split('.');
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded)) as KeycloakTokenPayload;
  } catch {
    return null;
  }
}

const ALLOWED_COMMENT_ROLES = new Set([
  'coordinator',
  'koordinator',
  'servicer',
  'serviser',
]);

function getSessionInfo(): { userId: number | null; canComment: boolean; displayName: string } {
  if (typeof window === 'undefined') return { userId: null, canComment: false, displayName: '' };

  const rawUser = window.localStorage.getItem('user');
  const token = window.localStorage.getItem('token');
  const roles = new Set<string>();
  let userId: number | null = null;
  let displayName = '';

  try {
    if (rawUser) {
      const user = JSON.parse(rawUser) as {
        id?: number;
        username?: string;
        firstName?: string;
        lastName?: string;
        role?: string;
        roles?: string[];
      };
      userId = user.id ?? null;
      displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || '';
      if (user.role) roles.add(user.role.toLowerCase());
      user.roles?.forEach((r) => roles.add(r.toLowerCase()));
    }
  } catch {
    // ignore
  }

  if (token) {
    const payload = decodeTokenPayload(token);
    payload?.realm_access?.roles?.forEach((r) => roles.add(r.toLowerCase()));
    Object.values(payload?.resource_access ?? {}).forEach((client) =>
      client.roles?.forEach((r) => roles.add(r.toLowerCase())),
    );
  }

  const canComment = Array.from(roles).some((r) => ALLOWED_COMMENT_ROLES.has(r));
  return { userId, canComment, displayName };
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('bs-BA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// ─── component ──────────────────────────────────────────────────────────────

interface CommentsSectionProps {
  interventionId: number | string;
}

export function CommentsSection({ interventionId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { userId, canComment } = getSessionInfo();

  const loadComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getComments(String(interventionId));
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri učitavanju komentara.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interventionId]);

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    if (!isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, isLoading]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    if (!userId) {
      setSubmitError('Nije moguće identificirati korisnika. Pokušajte se ponovo prijaviti.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const newComment = await createComment(String(interventionId), {
        text: trimmed,
        authorId: userId,
        // role is only a hint; server enforces via req.user
        role: 'COORDINATOR',
      });
      setComments((prev) => [...prev, newComment]);
      setText('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Greška pri slanju komentara.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      void handleSubmit();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Komentari
          {comments.length > 0 && (
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {comments.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── comment list ── */}
        <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 opacity-40" />
              <p className="text-sm">Nema komentara. Budite prvi koji komentariše.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.author.firstName, comment.author.lastName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 rounded-lg border bg-muted/30 px-3 py-2">
                  <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-semibold">
                      {comment.author.firstName} {comment.author.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">@{comment.author.username}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── input form ── */}
        {canComment ? (
          <div className="space-y-2 border-t pt-4">
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}

            <div className="flex gap-2">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-1 gap-2">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Napišite komentar… (Ctrl+Enter za slanje)"
                  rows={3}
                  disabled={isSubmitting}
                  className="resize-none flex-1"
                  maxLength={2000}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => void handleSubmit()}
                  disabled={!text.trim() || isSubmitting}
                  title="Pošalji komentar (Ctrl+Enter)"
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-right text-xs text-muted-foreground">
              {text.length}/2000
            </p>
          </div>
        ) : (
          <p className="border-t pt-4 text-center text-xs text-muted-foreground">
            Samo koordinatori i serviseri mogu dodavati komentare.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default CommentsSection;
