'use client';

import { useState } from 'react';
import type { BulkActionResponse } from '@/services/interventions.service';

interface BulkResultSummaryProps {
  result: BulkActionResponse;
  onDismiss: () => void;
}

export function BulkResultSummary({ result, onDismiss }: BulkResultSummaryProps) {
  const atomicFailure = result.totalSucceeded === 0 && result.totalSkipped > 0;
  const allSucceeded  = result.totalSkipped === 0 && result.totalSucceeded > 0;

  const [showDetails, setShowDetails] = useState(result.totalSkipped > 0);
  const skipped = result.results.filter((r) => !r.success);

  const colorClasses = allSucceeded
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : atomicFailure
      ? 'border-destructive/30 bg-destructive/5 text-destructive'
      : 'border-amber-200 bg-amber-50 text-amber-800';

  const summaryText = atomicFailure
    ? `No interventions were updated. ${result.totalSkipped} intervention${result.totalSkipped !== 1 ? 's' : ''} could not be processed – the action was cancelled to preserve consistency.`
    : allSucceeded
      ? `${result.totalSucceeded} of ${result.totalRequested} intervention${result.totalRequested !== 1 ? 's' : ''} successfully updated.`
      : `${result.totalSucceeded} of ${result.totalRequested} intervention${result.totalRequested !== 1 ? 's' : ''} successfully updated. ${result.totalSkipped} skipped.`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl border px-4 py-3 text-sm ring-1 ring-foreground/10 ${colorClasses}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{summaryText}</p>

        <div className="flex shrink-0 items-center gap-2">
          {result.totalSkipped > 0 && (
            <button
              type="button"
              className="text-xs underline underline-offset-2 hover:no-underline"
              onClick={() => setShowDetails((prev) => !prev)}
              aria-expanded={showDetails}
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          )}
          <button
            type="button"
            className="text-xs underline underline-offset-2 hover:no-underline"
            onClick={onDismiss}
            aria-label="Dismiss result summary"
          >
            Dismiss
          </button>
        </div>
      </div>

      {showDetails && skipped.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-current/20 pt-2">
          {skipped.map((item) => (
            <li key={item.id} className="text-xs">
              <span className="font-medium">#{item.id}</span>
              {item.reason ? ` — ${item.reason}` : ' — skipped'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}