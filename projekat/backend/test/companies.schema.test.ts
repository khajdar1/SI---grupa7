import { expect, test } from 'vitest';

import {
  createCompanySchema,
  selfRegisterCompanySchema,
  updateCompanySchema,
  updateCompanyStatusSchema,
} from '../src/modules/companies/companies.schema';

test('selfRegisterCompanySchema accepts valid public company registration', () => {
  const result = selfRegisterCompanySchema.safeParse({
    name: 'Beta Servis d.o.o.',
    contact: 'Amina Kontakt',
    type: 'servisna kompanija',
    email: 'BETA@example.com',
    phone: '+387 61 123 456',
    address: 'Zmaja od Bosne 1',
    identificationNumber: '4200000000000',
  });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.email).toBe('beta@example.com');
  }
});

test('selfRegisterCompanySchema rejects unsafe company values', () => {
  const result = selfRegisterCompanySchema.safeParse({
    name: '<script>alert(1)</script>',
    email: 'not-an-email',
  });

  expect(result.success).toBe(false);
});

test('createCompanySchema supports admin assignment and status', () => {
  const result = createCompanySchema.safeParse({
    name: 'Gamma d.o.o.',
    status: 'ACTIVE',
    adminUserId: 5,
  });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.status).toBe('ACTIVE');
    expect(result.data.adminUserId).toBe(5);
  }
});

test('updateCompanySchema blocks mass-assignment fields', () => {
  const result = updateCompanySchema.safeParse({
    name: 'Gamma Updated',
    status: 'INACTIVE',
    adminUserId: 4,
    companyId: 99,
  });

  expect(result.success).toBe(false);
});

test('updateCompanyStatusSchema accepts only known statuses', () => {
  expect(updateCompanyStatusSchema.safeParse({ status: 'PENDING' }).success).toBe(true);
  expect(updateCompanyStatusSchema.safeParse({ status: 'DELETED' }).success).toBe(false);
});
