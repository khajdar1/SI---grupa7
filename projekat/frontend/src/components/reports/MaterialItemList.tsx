'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { MATERIAL_LIMITS } from '@/constants';
import { type MaterialItem } from '@/services/reports.service';

interface RowError {
  name?: string;
  quantity?: string;
}

interface NameComboboxProps {
  value: string;
  suggestions: string[];
  disabled: boolean;
  placeholder: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function NameCombobox({
  value,
  suggestions,
  disabled,
  placeholder,
  error,
  onChange,
  onBlur,
}: NameComboboxProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = suggestions.filter((s) =>
    s.includes(value.toLowerCase()),
  );
  const showDropdown = open && filtered.length > 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.toLowerCase());
  };

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false);
      onBlur();
    }, 150);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        value={value}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={MATERIAL_LIMITS.NAME_MAX}
        aria-invalid={!!error}
        className={error ? 'border-destructive' : ''}
      />
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-input bg-background shadow-md">
          {filtered.map((suggestion) => (
            <div
              key={suggestion}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-muted"
              onMouseDown={() => handleSelect(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
      {error && (
        <p className="mt-0.5 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

interface MaterialItemListEditProps {
  items: MaterialItem[];
  suggestions: string[];
  disabled: boolean;
  onChange: (items: MaterialItem[]) => void;
}

function MaterialItemListEdit({
  items,
  suggestions,
  disabled,
  onChange,
}: MaterialItemListEditProps) {
  const { t } = useI18n();
  const [errors, setErrors] = useState<RowError[]>(() => items.map(() => ({})));

  useEffect(() => {
    setErrors((prev) => {
      if (prev.length === items.length) return prev;
      return items.map((_, i) => prev[i] ?? {});
    });
  }, [items.length]);

  const validateRow = (item: MaterialItem, idx: number): boolean => {
    const rowError: RowError = {};

    if (!item.name.trim()) {
      rowError.name = t('report.materialNameRequired');
    }
    if (!item.quantity || item.quantity <= 0 || !Number.isFinite(item.quantity)) {
      rowError.quantity = t('report.materialQuantityInvalid');
    }

    setErrors((prev) => {
      const next = [...prev];
      next[idx] = rowError;
      return next;
    });

    return Object.keys(rowError).length === 0;
  };

  const update = (idx: number, patch: Partial<MaterialItem>) => {
    const next = items.map((item, i) =>
      i === idx ? { ...item, ...patch } : item,
    );
    onChange(next);
    setErrors((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx] };
      if ('name' in patch) delete updated[idx].name;
      if ('quantity' in patch) delete updated[idx].quantity;
      return updated;
    });
  };

  const addRow = () => {
    if (items.length >= MATERIAL_LIMITS.ITEMS_MAX) return;
    onChange([...items, { name: '', quantity: 1, note: null }]);
    setErrors((prev) => [...prev, {}]);
  };

  const removeRow = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
    setErrors((prev) => prev.filter((_, i) => i !== idx));
  };

  const atLimit = items.length >= MATERIAL_LIMITS.ITEMS_MAX;

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('report.noMaterials')}</p>
      ) : (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_90px_1fr_36px] gap-2 px-0.5">
            <span className="text-xs font-medium text-muted-foreground">
              {t('report.materialName')}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {t('report.materialQuantity')}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {t('report.materialNote')}
            </span>
            <span />
          </div>

          {/* Rows */}
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_90px_1fr_36px] items-start gap-2">
              {/* Name combobox */}
              <NameCombobox
                value={item.name}
                suggestions={suggestions}
                disabled={disabled}
                placeholder={t('report.materialSearchPlaceholder')}
                error={errors[idx]?.name}
                onChange={(val) => update(idx, { name: val })}
                onBlur={() => validateRow(item, idx)}
              />

              {/* Quantity */}
              <div>
                <Input
                  type="number"
                  min={MATERIAL_LIMITS.QUANTITY_MIN}
                  step="any"
                  value={item.quantity === 0 ? '' : item.quantity}
                  disabled={disabled}
                  aria-invalid={!!errors[idx]?.quantity}
                  className={errors[idx]?.quantity ? 'border-destructive' : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    update(idx, { quantity: isNaN(val) ? 0 : val });
                  }}
                  onBlur={() => validateRow(item, idx)}
                />
                {errors[idx]?.quantity && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {errors[idx].quantity}
                  </p>
                )}
              </div>

              {/* Note */}
              <Input
                value={item.note ?? ''}
                disabled={disabled}
                placeholder={t('report.materialNotePlaceholder')}
                maxLength={MATERIAL_LIMITS.NOTE_MAX}
                onChange={(e) =>
                  update(idx, { note: e.target.value || null })
                }
              />

              {/* Remove button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                aria-label={t('report.removeMaterial')}
                className="mt-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(idx)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add row button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || atLimit}
        onClick={addRow}
        className="mt-1 gap-1.5"
        title={atLimit ? t('report.maxMaterialsReached') : undefined}
      >
        <Plus className="size-3.5" />
        {t('report.addMaterial')}
      </Button>

      {atLimit && (
        <p className="text-xs text-muted-foreground">{t('report.maxMaterialsReached')}</p>
      )}
    </div>
  );
}

interface MaterialItemListReadProps {
  items: MaterialItem[];
}

export function MaterialItemListRead({ items }: MaterialItemListReadProps) {
  const { t } = useI18n();

  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground">{t('report.noMaterials')}</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
            <th className="pb-2 pr-4">{t('report.materialName')}</th>
            <th className="pb-2 px-4 text-right">{t('report.materialQuantity')}</th>
            <th className="pb-2 pl-4">{t('report.materialNote')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {items.map((item, idx) => (
            <tr key={idx} className="align-top">
              <td className="py-2 pr-4 font-medium capitalize">{item.name}</td>
              <td className="py-2 px-4 text-right tabular-nums">{item.quantity}</td>
              <td className="py-2 pl-4 text-muted-foreground">{item.note ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface MaterialItemListProps {
  items: MaterialItem[];
  suggestions: string[];
  disabled: boolean;
  readOnly?: boolean;
  onChange: (items: MaterialItem[]) => void;
}

export function MaterialItemList({
  items,
  suggestions,
  disabled,
  readOnly = false,
  onChange,
}: MaterialItemListProps) {
  if (readOnly) {
    return <MaterialItemListRead items={items} />;
  }

  return (
    <MaterialItemListEdit
      items={items}
      suggestions={suggestions}
      disabled={disabled}
      onChange={onChange}
    />
  );
}