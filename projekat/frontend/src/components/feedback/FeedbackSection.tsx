'use client';

import { useEffect, useState } from 'react';
import { MessageSquareText, Star } from 'lucide-react';

import { INTERVENTION_STATUS, type InterventionStatus } from '@shared/enums';

import { ConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  createInterventionFeedback,
  getInterventionFeedback,
  type InterventionFeedback,
} from '@/services/feedback.service';

const COMMENT_MAX_LENGTH = 1000;
const RATINGS = [1, 2, 3, 4, 5] as const;

export interface FeedbackSectionProps {
  interventionId: number;
  interventionStatus: InterventionStatus;
  canRead: boolean;
  canSubmit: boolean;
}

export function FeedbackSection({
  interventionId,
  interventionStatus,
  canRead,
  canSubmit,
}: FeedbackSectionProps) {
  const [feedback, setFeedback] = useState<InterventionFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isHiddenForUser, setIsHiddenForUser] = useState(false);

  const isResolved = interventionStatus === INTERVENTION_STATUS.RESOLVED;
  const canSeeSection = isResolved && (canRead || canSubmit);

  useEffect(() => {
    if (!canSeeSection) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      setIsHiddenForUser(false);

      try {
        const data = await getInterventionFeedback(interventionId);
        if (!cancelled) setFeedback(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load feedback.';
        if (!cancelled) {
          if (message.toLowerCase().includes('permission')) {
            setIsHiddenForUser(true);
          } else {
            setError(message);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [interventionId, canSeeSection]);

  const handleOpenConfirm = () => {
    setError(null);
    setSuccessMessage('');
    setIsConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const created = await createInterventionFeedback(interventionId, {
        rating,
        comment: comment.trim() || null,
      });
      setFeedback(created);
      setComment('');
      setSuccessMessage('Feedback has been submitted successfully.');
      setIsConfirmOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback.');
      setIsConfirmOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!canSeeSection || isHiddenForUser) return null;

  return (
    <Card className="stat-card-glow">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquareText className="size-4 text-primary" />
          </div>
          <CardTitle className="text-base">User Feedback</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {successMessage ? (
          <p className="rounded-lg border border-emerald-300/40 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : feedback ? (
          <FeedbackReadView feedback={feedback} />
        ) : canSubmit ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Feedback rating">
                {RATINGS.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={rating === value ? 'default' : 'outline'}
                    className="h-9 w-10 gap-1 px-0"
                    onClick={() => setRating(value)}
                    aria-pressed={rating === value}
                  >
                    <Star className="size-3.5" />
                    {value}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="feedback-comment">Comment</Label>
              <Textarea
                id="feedback-comment"
                value={comment}
                maxLength={COMMENT_MAX_LENGTH}
                rows={4}
                placeholder="Add an optional comment..."
                onChange={(event) => setComment(event.target.value)}
                disabled={isSaving}
              />
              <p className="text-right text-xs text-muted-foreground">
                {comment.length} / {COMMENT_MAX_LENGTH}
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="button" size="sm" onClick={handleOpenConfirm} disabled={isSaving}>
                Submit Feedback
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Feedback has not been submitted for this intervention yet.
          </p>
        )}
      </CardContent>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          void handleSubmit();
        }}
        title="Submit feedback"
        description="Feedback can be submitted only once for this intervention."
        confirmLabel="Submit"
        cancelLabel="Cancel"
        variant="default"
        isLoading={isSaving}
      />
    </Card>
  );
}

function FeedbackReadView({ feedback }: { feedback: InterventionFeedback }) {
  const formattedDate = new Date(feedback.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">
          {feedback.user.firstName} {feedback.user.lastName}
        </span>
        <span className="text-muted-foreground">@{feedback.user.username}</span>
        <span className="text-muted-foreground">Saved: {formattedDate}</span>
      </div>

      <div className="flex gap-1" aria-label={`Rating ${feedback.rating} out of 5`}>
        {RATINGS.map((value) => (
          <Star
            key={value}
            className={
              value <= feedback.rating
                ? 'size-4 fill-primary text-primary'
                : 'size-4 text-muted-foreground'
            }
          />
        ))}
      </div>

      {feedback.comment ? (
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="whitespace-pre-wrap text-sm">{feedback.comment}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No comment was added.</p>
      )}
    </div>
  );
}
