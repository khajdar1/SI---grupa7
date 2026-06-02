'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { translateCategoryName, translateLocationValue, useI18n } from '@/lib/i18n';
import {
  getInterventionKnowledgeBase,
  type KnowledgeBaseSolution,
} from '@/services/interventions.service';

interface KnowledgeBaseSectionProps {
  interventionId: number;
  canUseAsTemplate?: boolean;
  onUseSolution?: (solution: KnowledgeBaseSolution) => void;
}

export function KnowledgeBaseSection({
  interventionId,
  canUseAsTemplate = false,
  onUseSolution,
}: KnowledgeBaseSectionProps) {
  const { language, t } = useI18n();
  const [solutions, setSolutions] = useState<KnowledgeBaseSolution[]>([]);
  const [filters, setFilters] = useState({ text: '', location: '' });
  const [appliedFilters, setAppliedFilters] = useState({ text: '', location: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getInterventionKnowledgeBase(interventionId, appliedFilters);
        if (!cancelled) {
          setSolutions(response.data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('knowledgeBase.loadFailed'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [interventionId, appliedFilters, t]);

  const handleSearch = () => {
    setAppliedFilters({
      text: filters.text.trim(),
      location: filters.location.trim(),
    });
  };

  const handleReset = () => {
    setFilters({ text: '', location: '' });
    setAppliedFilters({ text: '', location: '' });
  };

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
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1">
            <Label htmlFor="knowledge-text">{t('knowledgeBase.searchText')}</Label>
            <Input
              id="knowledge-text"
              value={filters.text}
              onChange={(event) =>
                setFilters((current) => ({ ...current, text: event.target.value }))
              }
              placeholder={t('knowledgeBase.searchTextPlaceholder')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="knowledge-location">{t('knowledgeBase.searchLocation')}</Label>
            <Input
              id="knowledge-location"
              value={filters.location}
              onChange={(event) =>
                setFilters((current) => ({ ...current, location: event.target.value }))
              }
              placeholder={t('knowledgeBase.searchLocationPlaceholder')}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" onClick={handleSearch}>
              {t('knowledgeBase.search')}
            </Button>
            <Button type="button" variant="ghost" onClick={handleReset}>
              {t('knowledgeBase.reset')}
            </Button>
          </div>
        </div>

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
          <p className="text-sm text-muted-foreground">{t('knowledgeBase.empty')}</p>
        ) : (
          <SolutionGroup
            title={t('knowledgeBase.recommendedTitle')}
            items={solutions}
            language={language}
            canUseAsTemplate={canUseAsTemplate}
            onUseSolution={onUseSolution}
          />
        )}
      </CardContent>
    </Card>
  );
}

function SolutionGroup({
  title,
  items,
  language,
  canUseAsTemplate,
  onUseSolution,
}: {
  title: string;
  items: KnowledgeBaseSolution[];
  language: 'en' | 'bs';
  canUseAsTemplate: boolean;
  onUseSolution?: (solution: KnowledgeBaseSolution) => void;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <SolutionCard
            key={item.reportId}
            item={item}
            language={language}
            canUseAsTemplate={canUseAsTemplate}
            onUseSolution={onUseSolution}
          />
        ))}
      </div>
    </section>
  );
}

function SolutionCard({
  item,
  language,
  canUseAsTemplate,
  onUseSolution,
}: {
  item: KnowledgeBaseSolution;
  language: 'en' | 'bs';
  canUseAsTemplate: boolean;
  onUseSolution?: (solution: KnowledgeBaseSolution) => void;
}) {
  const { t } = useI18n();
  const reportDate = new Date(item.reportDate).toLocaleDateString(
    language === 'bs' ? 'bs-BA' : 'en-GB',
  );
  const material = formatMaterialValue(item.material);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{item.title}</p>
            <Badge variant="secondary" className="gap-1">
              <Star className="size-3" />
              {t('knowledgeBase.recommendedBadge')}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {translateCategoryName(language, item.categoryName)} /{' '}
            {translateLocationValue(language, item.locationHint)} / {reportDate}
          </p>
        </div>
        {canUseAsTemplate ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onUseSolution?.(item)}
          >
            {t('knowledgeBase.useAsTemplate')}
          </Button>
        ) : null}
      </div>
      <div className="mb-3 rounded-lg bg-muted/40 p-3">
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          {t('knowledgeBase.problem')}
        </p>
        <p className="whitespace-pre-wrap text-sm">{item.problemDescription}</p>
      </div>
      <p className="whitespace-pre-wrap text-sm">{item.solution}</p>
      {material ? (
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium">{t('knowledgeBase.material')}:</span>{' '}
          {material}
        </p>
      ) : null}
      {item.notes ? (
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-medium">{t('knowledgeBase.notes')}:</span>{' '}
          {item.notes}
        </p>
      ) : null}
    </div>
  );
}

function formatMaterialValue(material: string | null): string | null {
  if (!material?.trim()) return null;

  try {
    const parsed = JSON.parse(material) as unknown;
    if (Array.isArray(parsed)) {
      const formatted = parsed
        .filter((item): item is { name: string; quantity: number; note?: string | null } => (
          typeof item === 'object' &&
          item !== null &&
          typeof (item as { name?: unknown }).name === 'string' &&
          typeof (item as { quantity?: unknown }).quantity === 'number'
        ))
        .map((item) => {
          const base = `${item.name} (x${item.quantity})`;
          return item.note ? `${base} - ${item.note}` : base;
        });

      if (formatted.length > 0) return formatted.join(', ');
    }
  } catch {
  }

  return material;
}
