import { z } from "zod";

import {
  emailField,
  personNameField,
  requiredPasswordField,
} from "../../shared/validation";

export const supportedLanguageSchema = z.enum(["en", "bs"]);
export type SupportedLanguage = z.infer<typeof supportedLanguageSchema>;

export const updateProfileSchema = z
  .object({
    firstName: personNameField("First name", { max: 100 }),
    lastName: personNameField("Last name", { max: 100 }),
    email: emailField(),
    language: supportedLanguageSchema,
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: requiredPasswordField("Current password"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be at most 128 characters.")
      .regex(/[0-9]/, "Password must contain at least one number.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter."),
    confirmPassword: z.string().min(1, "Password confirmation is required."),
  })
  .strict()
  .refine((input) => input.newPassword === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Password confirmation does not match.",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
