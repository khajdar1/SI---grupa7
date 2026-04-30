import { z } from "zod";

import { optionalSafeTextField, safeTextField } from "../../shared/validation";

export const createCategorySchema = z
  .object({
    name: safeTextField("Name", { max: 100 }),
    description: optionalSafeTextField("Description", 500),
  })
  .strict();

export const updateCategorySchema = z
  .object({
    name: safeTextField("Name", { max: 100 }).optional(),
    description: optionalSafeTextField("Description", 500),
  })
  .strict()
  .refine(
    (value) => value.name !== undefined || value.description !== undefined,
    {
      message: "At least one field must be provided.",
      path: ["name"],
    },
  );

export const updateCategoryStatusSchema = z
  .object({
    active: z.boolean({
      required_error: "Active status is required.",
      invalid_type_error: "Active status must be true or false.",
    }),
  })
  .strict();
