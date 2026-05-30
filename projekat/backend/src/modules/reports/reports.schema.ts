import { z } from 'zod';

import { REPORT_FIELD_MAX_LENGTH } from '../../services/reports.service';
import { MATERIAL_ITEM_LIMITS } from '../../shared/material-item';

const materialItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Material name is required.')
    .max(
      MATERIAL_ITEM_LIMITS.NAME_MAX,
      `Material name must not exceed ${MATERIAL_ITEM_LIMITS.NAME_MAX} characters.`,
    )
    .transform((v) => v.toLowerCase()),
 
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number.' })
    .positive('Quantity must be greater than zero.')
    .finite('Quantity must be a valid number.'),
 
  note: z
    .string()
    .trim()
    .max(
      MATERIAL_ITEM_LIMITS.NOTE_MAX,
      `Note must not exceed ${MATERIAL_ITEM_LIMITS.NOTE_MAX} characters.`,
    )
    .nullable()
    .optional()
    .transform((v) => (!v || v === '' ? null : v)),
});

const materialItemsArraySchema = z
  .array(materialItemSchema)
  .max(
    MATERIAL_ITEM_LIMITS.ITEMS_MAX,
    `Cannot add more than ${MATERIAL_ITEM_LIMITS.ITEMS_MAX} materials.`,
  );

function optionalTextField(maxLength: number, label: string) {
  return z
    .string()
    .trim()
    .max(maxLength, `${label} must not exceed ${maxLength} characters.`)
    .nullable()
    .optional()
    .transform((val) => (val === undefined || val === '' ? null : val));
}

function patchOptionalTextField(maxLength: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} cannot be set to an empty string. Send null to clear the field.`)
    .max(maxLength, `${label} must not exceed ${maxLength} characters.`)
    .nullable()
    .optional();
}

export const createReportSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Work description is required.')
    .max(
      REPORT_FIELD_MAX_LENGTH.DESCRIPTION,
      `Work description must not exceed ${REPORT_FIELD_MAX_LENGTH.DESCRIPTION} characters.`,
    ),
 
  materialItems: materialItemsArraySchema.optional().default([]),
 
  notes: optionalTextField(REPORT_FIELD_MAX_LENGTH.NOTES, 'Notes'),
});
 
export const updateReportSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, 'Work description cannot be empty.')
      .max(
        REPORT_FIELD_MAX_LENGTH.DESCRIPTION,
        `Work description must not exceed ${REPORT_FIELD_MAX_LENGTH.DESCRIPTION} characters.`,
      )
      .optional(),

    materialItems: materialItemsArraySchema.optional(),
 
    notes: patchOptionalTextField(REPORT_FIELD_MAX_LENGTH.NOTES, 'Notes'),
  })
  .refine(
    (data) =>
      data.description !== undefined ||
      data.materialItems !== undefined ||
      data.notes !== undefined,
    { message: 'At least one field must be provided for update.' },
  );
 
export type CreateReportDto = z.infer<typeof createReportSchema>;
export type UpdateReportDto = z.infer<typeof updateReportSchema>;
export type MaterialItemDto = z.infer<typeof materialItemSchema>;