import { z } from 'zod';

import { REPORT_FIELD_MAX_LENGTH } from '../../services/reports.service';

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
  material: optionalTextField(REPORT_FIELD_MAX_LENGTH.MATERIAL, 'Materials used'),
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
    material: patchOptionalTextField(REPORT_FIELD_MAX_LENGTH.MATERIAL, 'Materials used'),
    notes: patchOptionalTextField(REPORT_FIELD_MAX_LENGTH.NOTES, 'Notes'),
  })
  .refine(
    (data) =>
      data.description !== undefined ||
      data.material !== undefined ||
      data.notes !== undefined,
    { message: 'At least one field must be provided for update.' },
  );

export type CreateReportDto = z.infer<typeof createReportSchema>;
export type UpdateReportDto = z.infer<typeof updateReportSchema>;