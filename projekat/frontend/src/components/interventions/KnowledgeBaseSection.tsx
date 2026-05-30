'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Star } from 'lucide-react';

import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { translateCategoryName, translateLocationValue, useI18n } from '@/lib/i18n';
import {
  getInterventionKnowledgeBase,
  type KnowledgeBaseSolution,
} from '@/services/interventions.service';

interface KnowledgeBaseSectionProps {
  interventionId: number;
}

export function KnowledgeBaseSection({ interventionId }: KnowledgeBaseSectionProps) {
  const { language, t } = useI18n();
  const [solutions, setSolutions] = useState<KnowledgeBaseSolution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getInterventionKnowledgeBase(interventionId);
        if (!cancelled) {
          setSolutions(response.data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : t('knowledgeBase.loadFailed'),
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [interventionId, language]);

  return (
    <Card className="stat-card-glow">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="size-4 text-primary" />
          </div>
          <CardTitle className="text-base">{t('knowledgeBase.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        ) : solutions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('knowledgeBase.empty')}
          </p>
        ) : (
          <div className="space-y-5">
            <SolutionGroup
              title={t('knowledgeBase.recommendedTitle')}
              items={solutions}
              language={language}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SolutionGroup({
  title,
  items,
  language,
}: {
  title: string;
  items: KnowledgeBaseSolution[];
  language: 'en' | 'bs';
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <SolutionCard key={`${item.reportId}-${item.interventionId}`} item={item} language={language} />
        ))}
      </div>
    </section>
  );
}

function SolutionCard({
  item,
  language,
}: {
  item: KnowledgeBaseSolution;
  language: 'en' | 'bs';
}) {
  const { t } = useI18n();
  const reportDate = new Date(item.reportDate).toLocaleDateString(
    language === 'bs' ? 'bs-BA' : 'en-GB',
  );

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{item.title}</p>
            {item.isRecommended ? (
              <Badge variant="secondary" className="gap-1">
                <Star className="size-3" />
                {t('knowledgeBase.recommendedBadge')}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {translateCategoryName(language, item.categoryName)} ·{' '}
            {translateLocationValue(language, item.location)} · {reportDate}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.INTERVENTION(item.interventionId)}>
            {t('knowledgeBase.open')}
          </Link>
        </Button>
      </div>
      <p className="whitespace-pre-wrap text-sm">{item.solution}</p>
      {item.material ? (
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium">{t('knowledgeBase.material')}:</span>{' '}
          {item.material}
        </p>
      ) : null}
      {item.notes ? (
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-medium">{t('knowledgeBase.notes')}:</span>{' '}
          {item.notes}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        {t('knowledgeBase.technician')}: {item.servicer}
      </p>
    </div>
  );
}
