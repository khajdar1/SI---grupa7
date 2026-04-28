import { z } from "zod";

const htmlPattern = /<[^>]+>/;

export function safeTextField(fieldLabel: string, options?: { min?: number; max?: number }) {
  const min = options?.min ?? 1;
  const max = options?.max ?? 255;

  const baseSchema = z
    .string()
    .trim()
    .min(1, `${fieldLabel} is required.`)
    .max(max, `${fieldLabel} must be at most ${max} characters.`)
    .refine((value) => !htmlPattern.test(value), {
      message: `${fieldLabel} must not contain HTML or script content.`,
    });

  return min > 1
    ? baseSchema.refine(
        (value) => value.length >= min,
        `${fieldLabel} must be at least ${min} characters.`,
      )
    : baseSchema;
}

export function optionalSafeTextField(fieldLabel: string, max = 1000) {
  return z
    .string()
    .trim()
    .max(max, `${fieldLabel} must be at most ${max} characters.`)
    .refine((value) => !htmlPattern.test(value), {
      message: `${fieldLabel} must not contain HTML or script content.`,
    })
    .optional()
    .transform((value) => (value === "" ? undefined : value));
}

export function emailField() {
  return z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Invalid email format.")
    .max(254, "Email must be at most 254 characters.")
    .transform((value) => value.toLowerCase());
}

export function requiredPasswordField(fieldLabel: string) {
  return z.string().min(1, `${fieldLabel} is required.`);
}

export function calendarDateField(fieldLabel: string) {
  return z
    .string()
    .trim()
    .min(1, `${fieldLabel} is required.`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${fieldLabel} must be in YYYY-MM-DD format.`)
    .refine((value) => {
      const [year, month, day] = value.split("-").map(Number);
      const candidate = new Date(Date.UTC(year, month - 1, day));

      return (
        candidate.getUTCFullYear() === year &&
        candidate.getUTCMonth() === month - 1 &&
        candidate.getUTCDate() === day
      );
    }, `${fieldLabel} must be a valid calendar date.`);
}
