import { z } from "zod";

import {
  emailField,
  requiredPasswordField,
  safeTextField,
} from "../../shared/validation";

export const registerSchema = z
  .object({
    firstName: safeTextField("First name", { max: 100 }),
    lastName: safeTextField("Last name", { max: 100 }),
    username: safeTextField("Username", { min: 2, max: 50 }),
    email: emailField(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be at most 128 characters.")
      .regex(/[0-9]/, "Password must contain at least one number.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter."),
  })
  .strict();

export const loginSchema = z
  .object({
    username: safeTextField("Username", { max: 50 }),
    password: requiredPasswordField("Password"),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    email: emailField(),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
