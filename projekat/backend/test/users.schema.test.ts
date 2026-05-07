import { expect, test } from 'vitest';

import { createUserSchema, updateUserSchema } from '../src/modules/users/users.schema';

test('createUserSchema accepts valid admin-created user payload', () => {
  const result = createUserSchema.safeParse({
    firstName: 'Lejla',
    lastName: 'Korisnik',
    username: 'lejla.korisnik',
    email: 'LEJLA@example.com',
    password: 'Password1',
    role: 'KORISNIK',
    companyId: 1,
  });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.email).toBe('lejla@example.com');
  }
});

test('createUserSchema rejects weak passwords and invalid roles', () => {
  const result = createUserSchema.safeParse({
    firstName: 'Lejla',
    lastName: 'Korisnik',
    username: 'lejla.korisnik',
    email: 'lejla@example.com',
    password: 'password',
    role: 'OWNER',
    companyId: 1,
  });

  expect(result.success).toBe(false);
});

test('updateUserSchema requires at least one editable field', () => {
  const result = updateUserSchema.safeParse({});
  expect(result.success).toBe(false);
});
