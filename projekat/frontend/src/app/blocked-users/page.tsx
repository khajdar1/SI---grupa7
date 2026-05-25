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
import { translateText, useI18n, type LanguageCode } from '@/lib/i18n';
import {
  blockUser,
  getBlockedUsers,
  unblockUser,
  type BlockRecord,
} from '@/services/blocking.service';

const COORDINATOR_ROLES = new Set(['koordinator', 'coordinator', 'admin', 'administrator']);
const MAX_REASON_LENGTH = 1000;

const copy = {
  en: {
    title: 'Blocked Users',
    blockUser: 'Block user',
    listTitle: 'Blocked users list',
    empty: 'No blocked users.',
    accessDenied: 'You do not have permission to access this page.',
    loadError: 'Failed to load blocked users.',
    unblockError: 'Failed to unblock user.',
    usernameRequired: 'Username is required.',
    reasonRequired: 'Reason is required.',
    blockError: 'Failed to block user.',
    blockedBy: 'Blocked by',
    unblock: 'Unblock',
    blockDialogTitle: 'Block user',
    blockDialogDescription: 'Enter the username and reason for blocking. The blocked user will not be able to submit fault reports to your company.',
    username: 'Username',
    usernamePlaceholder: 'e.g. user1',
    reason: 'Blocking reason',
    reasonPlaceholder: 'Describe the blocking reason...',
    cancel: 'Cancel',
    blocking: 'Blocking...',
    block: 'Block',
    confirmUnblock: 'Confirm unblock',
    unblockDescriptionStart: 'Are you sure you want to unblock user',
    unblockDescriptionEnd: 'The user will be able to submit fault reports again immediately.',
    unblocking: 'Unblocking...',
  },
  bs: {
    title: 'Blokirani korisnici',
    blockUser: 'Blokiraj korisnika',
    listTitle: 'Lista blokiranih korisnika',
    empty: 'Nema blokiranih korisnika.',
    accessDenied: 'Nemate dozvolu za pristup ovoj stranici.',
    loadError: 'Ucitavanje blokiranih korisnika nije uspjelo.',
    unblockError: 'Deblokiranje korisnika nije uspjelo.',
    usernameRequired: 'Korisnicko ime je obavezno.',
    reasonRequired: 'Razlog je obavezan.',
    blockError: 'Blokiranje korisnika nije uspjelo.',
    blockedBy: 'Blokirao',
    unblock: 'Deblokiraj',
    blockDialogTitle: 'Blokiraj korisnika',
    blockDialogDescription: 'Unesite korisnicko ime i razlog blokiranja. Blokirani korisnik nece moci podnositi prijave kvarova vasoj kompaniji.',
    username: 'Korisnicko ime',
    usernamePlaceholder: 'npr. korisnik1',
    reason: 'Razlog blokiranja',
    reasonPlaceholder: 'Opisite razlog blokiranja...',
    cancel: 'Odustani',
    blocking: 'Blokiranje...',
    block: 'Blokiraj',
    confirmUnblock: 'Potvrdi deblokiranje',
    unblockDescriptionStart: 'Da li ste sigurni da zelite deblokirati korisnika',
    unblockDescriptionEnd: 'Korisnik ce odmah moci ponovo podnositi prijave kvarova.',
    unblocking: 'Deblokiranje...',
  },
} as const;

function formatDateTime(value: string, language: LanguageCode): string {
  return new Intl.DateTimeFormat(language === 'bs' ? 'bs-BA' : 'en-US', {
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
  const { language } = useI18n();
  const text = copy[language];
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
      setError(err instanceof Error ? translateText(language, err.message) : text.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBlocks();
  }, [language]);

  const openBlockDialog = () => setBlockDialog({ ...INITIAL_BLOCK_STATE, isOpen: true });

  const closeBlockDialog = () => setBlockDialog(INITIAL_BLOCK_STATE);

  const handleBlock = async () => {
    if (!blockDialog.username.trim()) {
      setBlockDialog((prev) => ({ ...prev, error: text.usernameRequired }));
      return;
    }
    if (!blockDialog.reason.trim()) {
      setBlockDialog((prev) => ({ ...prev, error: text.reasonRequired }));
      return;
    }

    setBlockDialog((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const newBlock = await blockUser({
        username: blockDialog.username.trim(),
        reason: blockDialog.reason.trim(),
      });
      setBlocks((prev) => [newBlock, ...prev]);
      closeBlockDialog();
    } catch (err: unknown) {
      setBlockDialog((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? translateText(language, err.message) : text.blockError,
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
      setError(err instanceof Error ? translateText(language, err.message) : text.unblockError);
      closeUnblockDialog();
    }
  };

  if (!canManage) {
    return (
      <PageLayout>
        <PageHeader title={text.title} />
        <p className="text-muted-foreground mt-4">{text.accessDenied}</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={text.title}
        primaryAction={{
          label: text.blockUser,
          onClick: openBlockDialog,
        }}
      />

      {error ? <p className="text-destructive text-sm mb-4">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>{text.listTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : blocks.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">{text.empty}</p>
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
                      {text.blockedBy}: {block.coordinator.username} &middot;{' '}
                      {formatDateTime(block.blockedAt, language)}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openUnblockDialog(block)}>
                    {text.unblock}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={blockDialog.isOpen} onOpenChange={(open) => !open && closeBlockDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{text.blockDialogTitle}</DialogTitle>
            <DialogDescription>{text.blockDialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="block-username">{text.username}</Label>
              <Input
                id="block-username"
                type="text"
                placeholder={text.usernamePlaceholder}
                value={blockDialog.username}
                onChange={(e) =>
                  setBlockDialog((prev) => ({ ...prev, username: e.target.value, error: null }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="block-reason">{text.reason}</Label>
              <Textarea
                id="block-reason"
                placeholder={text.reasonPlaceholder}
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

            {blockDialog.error ? (
              <p className="text-destructive text-sm">{blockDialog.error}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeBlockDialog} disabled={blockDialog.isLoading}>
              {text.cancel}
            </Button>
            <Button variant="destructive" onClick={handleBlock} disabled={blockDialog.isLoading}>
              {blockDialog.isLoading ? text.blocking : text.block}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={unblockDialog.isOpen} onOpenChange={(open) => !open && closeUnblockDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{text.confirmUnblock}</DialogTitle>
            <DialogDescription>
              {text.unblockDescriptionStart}{' '}
              <strong>{unblockDialog.username}</strong>? {text.unblockDescriptionEnd}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeUnblockDialog}
              disabled={unblockDialog.isLoading}
            >
              {text.cancel}
            </Button>
            <Button onClick={handleUnblock} disabled={unblockDialog.isLoading}>
              {unblockDialog.isLoading ? text.unblocking : text.unblock}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
