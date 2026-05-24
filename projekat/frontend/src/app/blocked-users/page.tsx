'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';

import { PageHeader, PageLayout } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { hasSessionRole } from '@/lib/auth';
import {
  blockUser,
  getBlockedUsers,
  unblockUser,
  type BlockRecord,
} from '@/services/blocking.service';

const COORDINATOR_ROLES = new Set(['koordinator', 'coordinator', 'admin', 'administrator']);

const MAX_REASON_LENGTH = 1000;

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('bs-BA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

interface BlockDialogState {
  isOpen: boolean;
  username: string;
  reason: string;
  isLoading: boolean;
  error: string | null;
}

const INITIAL_BLOCK_STATE: BlockDialogState = {
  isOpen: false,
  username: '',
  reason: '',
  isLoading: false,
  error: null,
};

interface UnblockDialogState {
  isOpen: boolean;
  blockId: number | null;
  username: string;
  isLoading: boolean;
}

const INITIAL_UNBLOCK_STATE: UnblockDialogState = {
  isOpen: false,
  blockId: null,
  username: '',
  isLoading: false,
};

export default function BlockedUsersPage() {
  const [blocks, setBlocks] = useState<BlockRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockDialog, setBlockDialog] = useState<BlockDialogState>(INITIAL_BLOCK_STATE);
  const [unblockDialog, setUnblockDialog] = useState<UnblockDialogState>(INITIAL_UNBLOCK_STATE);

  const canManage = hasSessionRole(COORDINATOR_ROLES);

  const loadBlocks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBlockedUsers();
      setBlocks(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load blocked users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBlocks();
  }, []);

  const openBlockDialog = () => setBlockDialog({ ...INITIAL_BLOCK_STATE, isOpen: true });

  const closeBlockDialog = () => setBlockDialog(INITIAL_BLOCK_STATE);

  const handleBlock = async () => {
    if (!blockDialog.username.trim()) {
      setBlockDialog((prev) => ({ ...prev, error: 'Korisničko ime je obavezno.' }));
      return;
    }
    if (!blockDialog.reason.trim()) {
      setBlockDialog((prev) => ({ ...prev, error: 'Razlog je obavezan.' }));
      return;
    }

    setBlockDialog((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const newBlock = await blockUser({ username: blockDialog.username.trim(), reason: blockDialog.reason.trim() });
      setBlocks((prev) => [newBlock, ...prev]);
      closeBlockDialog();
    } catch (err: unknown) {
      setBlockDialog((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Neuspješno blokiranje korisnika.',
      }));
    }
  };

  const openUnblockDialog = (block: BlockRecord) => {
    setUnblockDialog({
      isOpen: true,
      blockId: block.id,
      username: block.blockedUser.username,
      isLoading: false,
    });
  };

  const closeUnblockDialog = () => setUnblockDialog(INITIAL_UNBLOCK_STATE);

  const handleUnblock = async () => {
    if (!unblockDialog.blockId) return;

    setUnblockDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      await unblockUser(unblockDialog.blockId);
      setBlocks((prev) => prev.filter((b) => b.id !== unblockDialog.blockId));
      closeUnblockDialog();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to unblock user.');
      closeUnblockDialog();
    }
  };

  if (!canManage) {
    return (
      <PageLayout>
        <PageHeader title="Blokirani korisnici" />
        <p className="text-muted-foreground mt-4">
          Nemate dozvolu za pristup ovoj stranici.
        </p>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Blokirani korisnici"
        primaryAction={{
          label: 'Blokiraj korisnika',
          onClick: openBlockDialog,
        }}
      />

      {error && (
        <p className="text-destructive text-sm mb-4">{error}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista blokiranih korisnika</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : blocks.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">
              Nema blokiranih korisnika.
            </p>
          ) : (
            <div className="divide-y">
              {blocks.map((block) => (
                <div key={block.id} className="flex items-center justify-between py-4 gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {block.blockedUser.firstName} {block.blockedUser.lastName}{' '}
                      <span className="text-muted-foreground font-normal text-sm">
                        ({block.blockedUser.username})
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{block.reason}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Blokirao: {block.coordinator.username} &middot;{' '}
                      {formatDateTime(block.blockedAt)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openUnblockDialog(block)}
                  >
                    Deblokiraj
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block user dialog */}
      <Dialog open={blockDialog.isOpen} onOpenChange={(open) => !open && closeBlockDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blokiraj korisnika</DialogTitle>
            <DialogDescription>
              Unesite ID korisnika i razlog blokiranja. Blokirani korisnik neće moći
              podnositi prijave kvarova vašoj kompaniji.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="block-username">Korisničko ime</Label>
              <Input
                id="block-username"
                type="text"
                placeholder="npr. korisnik1"
                value={blockDialog.username}
                onChange={(e) =>
                  setBlockDialog((prev) => ({ ...prev, username: e.target.value, error: null }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="block-reason">Razlog blokiranja</Label>
              <Textarea
                id="block-reason"
                placeholder="Opišite razlog blokiranja..."
                maxLength={MAX_REASON_LENGTH}
                rows={3}
                value={blockDialog.reason}
                onChange={(e) =>
                  setBlockDialog((prev) => ({ ...prev, reason: e.target.value, error: null }))
                }
              />
              <p className="text-xs text-muted-foreground text-right">
                {blockDialog.reason.length}/{MAX_REASON_LENGTH}
              </p>
            </div>

            {blockDialog.error && (
              <p className="text-destructive text-sm">{blockDialog.error}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeBlockDialog} disabled={blockDialog.isLoading}>
              Odustani
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={blockDialog.isLoading}
            >
              {blockDialog.isLoading ? 'Blokiranje...' : 'Blokiraj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock confirm dialog */}
      <Dialog open={unblockDialog.isOpen} onOpenChange={(open) => !open && closeUnblockDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potvrdi deblokiranje</DialogTitle>
            <DialogDescription>
              Da li ste sigurni da želite deblokirat korisnika{' '}
              <strong>{unblockDialog.username}</strong>? Korisnik će odmah moći ponovo
              podnositi prijave kvarova.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeUnblockDialog}
              disabled={unblockDialog.isLoading}
            >
              Odustani
            </Button>
            <Button onClick={handleUnblock} disabled={unblockDialog.isLoading}>
              {unblockDialog.isLoading ? 'Deblokiranje...' : 'Deblokiraj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
