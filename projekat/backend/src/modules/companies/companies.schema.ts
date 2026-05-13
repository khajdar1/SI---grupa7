import { z } from 'zod';

import {
  emailField,
  optionalSafeTextField,
  safeTextField,
} from '../../shared/validation';

export const companyStatusSchema = z.enum(['PENDING', 'ACTIVE', 'REJECTED', 'INACTIVE']);

const phonePattern = /^[+0-9() .-]{6,30}$/;

function optionalNullableSafeTextField(fieldLabel: string, max = 255) {
  return z
    .union([
      safeTextField(fieldLabel, { max }),
      z.literal('').transform(() => null),
      z.null(),
    ])
    .optional();
}

function optionalNullableEmailField() {
  return z
    .union([
      emailField(),
      z.literal('').transform(() => null),
      z.null(),
    ])
    .optional();
}

const optionalNullablePhoneField = z
  .union([
    z
      .string()
      .trim()
      .regex(phonePattern, 'Phone number format is invalid.'),
    z.literal('').transform(() => null),
    z.null(),
  ])
  .optional();

const companyBaseSchema = {
  name: safeTextField('Company name', { min: 2, max: 150 }),
  contact: optionalSafeTextField('Contact', 150),
  type: optionalSafeTextField('Company type', 100),
  email: optionalNullableEmailField(),
  phone: optionalNullablePhoneField,
  address: optionalNullableSafeTextField('Address', 200),
  identificationNumber: optionalNullableSafeTextField('Identification number', 80),
};

export const selfRegisterCompanySchema = z
  .object(companyBaseSchema)
  .strict();

export const createCompanySchema = z
  .object({
    ...companyBaseSchema,
    status: companyStatusSchema.optional().default('ACTIVE'),
    adminUserId: z.union([z.number().int().positive(), z.null()]).optional(),
  })
  .strict();

export const updateCompanySchema = z
  .object({
    name: safeTextField('Company name', { min: 2, max: 150 }).optional(),
    contact: optionalNullableSafeTextField('Contact', 150),
    type: optionalNullableSafeTextField('Company type', 100),
    email: optionalNullableEmailField(),
    phone: optionalNullablePhoneField,
    address: optionalNullableSafeTextField('Address', 200),
    identificationNumber: optionalNullableSafeTextField('Identification number', 80),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  });

export const updateCompanyStatusSchema = z
  .object({
    status: companyStatusSchema,
  })
  .strict();

export const assignCompanyAdminSchema = z
  .object({
    userId: z.union([z.number().int().positive(), z.null()]),
  })
  .strict();

export type CompanyStatusInput = z.infer<typeof companyStatusSchema>;
export type SelfRegisterCompanyInput = z.infer<typeof selfRegisterCompanySchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type UpdateCompanyStatusInput = z.infer<typeof updateCompanyStatusSchema>;
export type AssignCompanyAdminInput = z.infer<typeof assignCompanyAdminSchema>;
