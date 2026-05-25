'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants';
import { translateInterventionStatus, translateLocationValue, useI18n, type LanguageCode } from '@/lib/i18n';
import type { PotentialDuplicateItem } from '@/models/FaultReport';

interface DuplicateWarningDialogProps {
  open: boolean;
  duplicates: PotentialDuplicateItem[];
  onContinue: () => void;
  onCancel: () => void;
}

function formatDate(iso: string, language: LanguageCode): string {
  return new Intl.DateTimeFormat(language === 'bs' ? 'bs-BA' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function statusVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (['RESOLVED', 'CANCELLED', 'REJECTED'].includes(status)) return 'secondary';
  if (status === 'IN_PROGRESS') return 'default';
  return 'outline';
}

export function DuplicateWarningDialog({
  open,
  duplicates,
  onContinue,
  onCancel,
}: DuplicateWarningDialogProps) {
  const { language } = useI18n();
  const top = duplicates[0];
  const duplicateCountText =
    duplicates.length === 1
      ? (language === 'bs' ? 'sličnu prijavu' : 'a similar report')
      : (language === 'bs' ? `${duplicates.length} sličnih prijava` : `${duplicates.length} similar reports`);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <DialogTitle className="text-amber-700">
              {language === 'bs' ? 'Moguća duplirana prijava' : 'Potential duplicate report'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            {language === 'bs'
              ? `Sistem je pronašao ${duplicateCountText} na istoj lokaciji od istog korisnika u posljednjih 48 sati. Provjerite status prije kreiranja nove prijave.`
              : `The system detected ${duplicateCountText} at the same location from the same user in the last 48 hours. Please check the status before creating a new report.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {duplicates.map((dup) => (
            <div
              key={dup.interventionId}
              className="rounded-md border p-3 space-y-1 bg-amber-50/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {language === 'bs' ? 'Intervencija' : 'Intervention'} #{dup.interventionId}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge variant={statusVariant(dup.status)} className="text-xs">
                    {translateInterventionStatus(language, dup.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {dup.similarityScore}% {language === 'bs' ? 'podudaranje' : 'match'}
                  </span>
                </div>
              </div>

              <p className="text-sm font-medium truncate" title={dup.location}>
                {dup.location
                  ? translateLocationValue(language, dup.location)
                  : (language === 'bs' ? '(lokacija nije navedena)' : '(location not provided)')}
              </p>

              {dup.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {dup.description}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                {language === 'bs' ? 'Prijavljeno' : 'Reported'}: {formatDate(dup.reportedAt, language)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {top && (
            <Button asChild variant="outline" size="sm">
              <Link href={ROUTES.INTERVENTION(String(top.interventionId))}>
                {language === 'bs' ? 'Prikaži postojeću intervenciju' : 'View existing intervention'}
              </Link>
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              {language === 'bs' ? 'Otkaži prijavu' : 'Cancel report'}
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={onContinue}
            >
              {language === 'bs' ? 'Ipak pošalji' : 'Submit anyway'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
