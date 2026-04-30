import type { RegisterFormData, RegisterFormErrors } from './register.types';

import { validateEmail, validateSafeText } from '@/lib/form-validation';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_STRONG_LENGTH = 12;
const STRENGTH_WEAK_MAX_SCORE = 1;
const STRENGTH_FAIR_SCORE = 2;
const STRENGTH_GOOD_SCORE = 3;
const STRENGTH_WEAK_LEVEL = 1;
const STRENGTH_FAIR_LEVEL = 2;
const STRENGTH_GOOD_LEVEL = 3;
const STRENGTH_STRONG_LEVEL = 4;

export function validateRegisterForm(data: RegisterFormData): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  errors.firstName = validateSafeText(data.firstName, {
    requiredMessage: 'First name is required.',
    maxLength: 100,
    maxLengthMessage: 'First name must be at most 100 characters long.',
  });
  errors.lastName = validateSafeText(data.lastName, {
    requiredMessage: 'Last name is required.',
    maxLength: 100,
    maxLengthMessage: 'Last name must be at most 100 characters long.',
  });
  errors.username = validateSafeText(data.username, {
    requiredMessage: 'Username is required.',
    minLength: 2,
    minLengthMessage: 'Username must be at least 2 characters long.',
    maxLength: 50,
    maxLengthMessage: 'Username must be at most 50 characters long.',
  });
  errors.email = validateEmail(
    data.email,
    'Email address is required.',
    'Invalid email format.',
  );

  if (!data.password) {
    errors.password = 'Password is required.';
  } else if (data.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = 'Password must be at least 8 characters long.';
  } else if (!/[0-9]/.test(data.password)) {
    errors.password = 'Password must contain at least one number.';
  } else if (!/[A-Z]/.test(data.password)) {
    errors.password = 'Password must contain at least one uppercase letter.';
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return Object.fromEntries(
    Object.entries(errors).filter(([, value]) => typeof value === 'string' && value.length > 0),
  );
}

export function getPasswordStrength(password: string): { level: number; label: string } {
  if (!password) {
    return { level: 0, label: '' };
  }

  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= PASSWORD_STRONG_LENGTH) score++;

  if (score <= STRENGTH_WEAK_MAX_SCORE) {
    return { level: STRENGTH_WEAK_LEVEL, label: 'Weak' };
  }
  if (score === STRENGTH_FAIR_SCORE) {
    return { level: STRENGTH_FAIR_LEVEL, label: 'Fair' };
  }
  if (score === STRENGTH_GOOD_SCORE) {
    return { level: STRENGTH_GOOD_LEVEL, label: 'Good' };
  }
  return { level: STRENGTH_STRONG_LEVEL, label: 'Strong' };
}
