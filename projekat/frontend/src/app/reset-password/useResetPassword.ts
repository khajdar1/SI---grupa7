'use client';

import { useState } from 'react';

import {
  clearFieldError,
  getApiFieldErrors,
  validateEmail,
} from '@/lib/form-validation';
import { requestPasswordReset } from '@/services/auth.service';

export function useResetPassword() {
  const [email, setEmailValue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const emailError = validateEmail(
      email,
      'Email is required.',
      'Enter a valid email address.',
    );

    if (emailError) {
      setErrors({ email: emailError });
      setMessage({ type: 'error', text: 'Please correct the highlighted fields.' });
      return;
    }

    setSubmitting(true);
    setErrors({});
    setMessage(null);

    try {
      await requestPasswordReset(email);
      setMessage({ type: 'success', text: 'A reset link has been sent to your inbox.' });
      setEmailValue('');
    } catch (error: unknown) {
      const serviceDetails =
        typeof error === 'object' && error !== null
          ? (error as { details?: unknown }).details
          : undefined;
      const backendFieldErrors = getApiFieldErrors(
        serviceDetails ? { response: (serviceDetails as { response?: unknown }).response } : error,
      );

      if (Object.keys(backendFieldErrors).length > 0) {
        setErrors(backendFieldErrors);
      }

      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to request reset. Please try again later.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return {
    email,
    setEmail: (value: string) => {
      setEmailValue(value);
      setErrors((prev) => clearFieldError(prev, 'email'));
    },
    errors,
    submitting,
    message,
    handleSubmit,
  };
}
