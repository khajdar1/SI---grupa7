import { InterventionStatus } from '@prisma/client';
import { z } from 'zod';

import { BULK_ACTIONS } from '../../constants';

const interventionIdsSchema = z
  .array(z.coerce.number().int().positive())
  .min(BULK_ACTIONS.MIN_IDS, 'At least one intervention must be selected.')
  .max(
    BULK_ACTIONS.MAX_IDS,
    `At most ${BULK_ACTIONS.MAX_IDS} interventions may be processed at once.`,
  )
  .transform((ids) => [...new Set(ids)]);

export const bulkActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('STATUS_CHANGE'),
    interventionIds: interventionIdsSchema,
    payload: z.object({
      status: z.nativeEnum(InterventionStatus),
    }),
  }),
  z.object({
    action: z.literal('ASSIGN_SERVICER'),
    interventionIds: interventionIdsSchema,
    payload: z.object({
      userId: z.coerce.number().int().positive('A valid servicer must be selected.'),
    }),
  }),
  z.object({
    action: z.literal('ARCHIVE'),
    interventionIds: interventionIdsSchema,
    payload: z.object({}),
  }),
]);

export type BulkActionInput = z.infer<typeof bulkActionSchema>;

export interface BulkActionItemResult {
  id: number;
  success: boolean;
  reason?: string;
}

export interface BulkActionResponse {
  totalRequested: number;
  totalSucceeded: number;
  totalSkipped: number;
  results: BulkActionItemResult[];
}