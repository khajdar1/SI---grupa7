'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  filters?: {
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (v: string) => void;
  }[];
  onClear?: () => void;
  isFiltered?: boolean;
}

export function FilterBar({ search, filters, onClear, isFiltered = false }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        {search ? (
          <Input
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            placeholder={search.placeholder ?? 'Search'}
            className="sm:max-w-sm"
          />
        ) : null}

        {filters?.map((filter) => (
          <div key={filter.key} className="min-w-44">
            <Select value={filter.value} onValueChange={(value) => filter.onChange(value ?? '')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {isFiltered && onClear ? (
        <Button type="button" variant="link" onClick={onClear}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

export type { FilterOption, FilterBarProps };
