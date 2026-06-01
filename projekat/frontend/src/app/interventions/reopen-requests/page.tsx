'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';

import { ROUTES } from '@/constants';
import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/lib/i18n';
import { getReopenRequests, approveReopenRequest, rejectReopenRequest } from '@/services/interventions.service';

interface ReopenRequest {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  comment: string | null;
  createdAt: string;
  resolvedAt: string | null;
  coordinatorComment: string | null;
  intervention: { id: number; name: string; status: string };
  requester: { id: number; firstName: string; lastName: string; username: string };
}

export default function ReopenRequestsPage() {
  const { language } = useI18n();
  const router = useRouter();
  const [requests, setRequests] = useState<ReopenRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReopenRequests();
      setRequests(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const handleApprove = async (requestId: number) => {
    setIsSubmitting(true);
    try {
      await approveReopenRequest(requestId);
      await loadRequests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectOpen = (requestId: number) => {
    setSelectedRequestId(requestId);
    setRejectComment('');
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedRequestId || !rejectComment.trim()) return;
    setIsSubmitting(true);
    try {
      await rejectReopenRequest(selectedRequestId, rejectComment.trim());
      setRejectDialogOpen(false);
      await loadRequests();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusLabel = (status: string) => {
    if (status === 'PENDING') return language === 'bs' ? 'Na čekanju' : 'Pending';
    if (status === 'APPROVED') return language === 'bs' ? 'Prihvaćen' : 'Approved';
    if (status === 'REJECTED') return language === 'bs' ? 'Odbijen' : 'Rejected';
    return status;
  };

  const statusColor = (status: string) => {
    if (status === 'PENDING') return 'text-yellow-600';
    if (status === 'APPROVED') return 'text-green-600';
    if (status === 'REJECTED') return 'text-red-600';
    return '';
  };

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title={language === 'bs' ? 'Zahtjevi za ponovno otvaranje' : 'Reopen Requests'}
        subtitle={language === 'bs' ? 'Pregled i upravljanje zahtjevima za ponovno otvaranje intervencija.' : 'Review and manage intervention reopen requests.'}
        breadcrumbs={[
          { label: language === 'bs' ? 'Početna' : 'Dashboard', href: ROUTES.DASHBOARD },
          { label: language === 'bs' ? 'Zahtjevi za ponovno otvaranje' : 'Reopen Requests' },
        ]}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {language === 'bs' ? 'Nema zahtjeva za ponovno otvaranje.' : 'No reopen requests found.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => router.push(ROUTES.INTERVENTION(String(req.intervention.id)))}
                    >
                      {req.intervention.name}
                    </button>
                  </CardTitle>
                  <span className={`text-sm font-medium ${statusColor(req.status)}`}>
                    {statusLabel(req.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">{language === 'bs' ? 'Podnosilac: ' : 'Requester: '}</span>
                  {req.requester.firstName} {req.requester.lastName} (@{req.requester.username})
                </p>
                <p>
                  <span className="text-muted-foreground">{language === 'bs' ? 'Obrazloženje: ' : 'Reason: '}</span>
                  {req.reason}
                </p>
                {req.comment ? (
                  <p>
                    <span className="text-muted-foreground">{language === 'bs' ? 'Komentar: ' : 'Comment: '}</span>
                    {req.comment}
                  </p>
                ) : null}
                {req.coordinatorComment ? (
                  <p>
                    <span className="text-muted-foreground">{language === 'bs' ? 'Komentar koordinatora: ' : 'Coordinator comment: '}</span>
                    {req.coordinatorComment}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {new Date(req.createdAt).toLocaleString(language === 'bs' ? 'bs-BA' : 'en-GB')}
                </p>
                {req.status === 'PENDING' ? (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => void handleApprove(req.id)}
                      disabled={isSubmitting}
                    >
                      <CheckCircle className="mr-1 size-4" />
                      {language === 'bs' ? 'Prihvati' : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectOpen(req.id)}
                      disabled={isSubmitting}
                    >
                      <XCircle className="mr-1 size-4" />
                      {language === 'bs' ? 'Odbij' : 'Reject'}
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'bs' ? 'Odbijanje zahtjeva' : 'Reject Request'}</DialogTitle>
            <DialogDescription>
              {language === 'bs' ? 'Unesite komentar za odbijanje zahtjeva.' : 'Enter a comment for rejecting the request.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-comment">{language === 'bs' ? 'Komentar' : 'Comment'}</Label>
            <Textarea
              id="reject-comment"
              rows={3}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isSubmitting}>
              {language === 'bs' ? 'Odustani' : 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={() => void handleRejectSubmit()} disabled={isSubmitting || !rejectComment.trim()}>
              {language === 'bs' ? 'Odbij' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}