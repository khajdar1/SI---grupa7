'use client';

import { UI } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { EmptyState } from './EmptyState';

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  onRowClick?: (row: T) => void;
  onRetry?: () => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  className?: string;
}

const alignClass: Record<NonNullable<Column<unknown>['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  error,
  emptyTitle = 'No data available',
  emptyDescription,
  emptyAction,
  onRowClick,
  onRetry,
  pagination,
  className,
}: DataTableProps<T>) {
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Failed to load data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{error}</p>
          {onRetry ? (
            <Button type="button" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (!isLoading && data.length === 0) {
    return (
      <EmptyState
        className={className}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  const renderRows = () => {
    if (isLoading) {
      return Array.from({ length: UI.SKELETON_ROWS }, (_, index) => (
        <TableRow key={`skeleton-${index}`}>
          {columns.map((column) => (
            <TableCell key={`${column.key}-${index}`}>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ));
    }

    return data.map((row) => (
      <TableRow
        key={keyExtractor(row)}
        className={cn(onRowClick ? 'cursor-pointer hover:bg-muted/50' : undefined)}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
      >
        {columns.map((column) => {
          const value = (row as Record<string, unknown>)[column.key];
          return (
            <TableCell
              key={column.key}
              className={alignClass[column.align ?? 'left']}
              style={column.width ? { width: column.width, maxWidth: column.width } : undefined}
            >
              {column.render ? column.render(value, row) : String(value ?? '')}
            </TableCell>
          );
        })}
      </TableRow>
    ));
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-lg border">
        <Table className="min-w-[1100px]">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={alignClass[column.align ?? 'left']}
                  style={column.width ? { width: column.width, maxWidth: column.width } : undefined}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{renderRows()}</TableBody>
        </Table>
      </div>

      {pagination ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type { Column, DataTableProps };
