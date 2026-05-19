import { z } from 'zod';
import {
  emailField,
  personNameField,
  safeTextField,
} from '../../shared/validation';

export const managedUserRoleSchema = z.enum([
  'KORISNIK',
  'SERVISER',
  'KOORDINATOR',
  'MENADZMENT',
  'KOMPANIJA_ADMIN',
  'SUPPORT_AGENT',
  'ADMIN',
]);

const optionalCompanyIdSchema = z
  .union([z.number().int().positive(), z.null()])
  .optional();

export const createUserSchema = z
  .object({
    firstName: personNameField('First name', { max: 100 }),
    lastName: personNameField('Last name', { max: 100 }),
    username: safeTextField('Username', { min: 2, max: 50 }),
    email: emailField(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(128, 'Password must be at most 128 characters.')
      .regex(/[0-9]/, 'Password must contain at least one number.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.'),
    role: managedUserRoleSchema,
    companyId: optionalCompanyIdSchema,
  })
  .strict();

export const updateUserSchema = z
  .object({
    firstName: personNameField('First name', { max: 100 }).optional(),
    lastName: personNameField('Last name', { max: 100 }).optional(),
    email: emailField().optional(),
    role: managedUserRoleSchema.optional(),
    companyId: optionalCompanyIdSchema,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  });

export type ManagedUserRole = z.infer<typeof managedUserRoleSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
