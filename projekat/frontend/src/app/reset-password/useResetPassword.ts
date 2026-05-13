'use client';

import { useState } from 'react';

import {
  clearFieldError,
  getApiFieldErrors,
  validateEmail,
} from '@/lib/form-validation';
import { confirmPasswordReset, requestPasswordReset } from '@/services/auth.service';

export function useResetPassword() {
  const [email, setEmailValue] = useState('');
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
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

  async function handleConfirmSubmit(e: React.FormEvent, token: string, onSuccess?: () => void) {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (passwordData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    } else if (!/[0-9]/.test(passwordData.password) || !/[A-Z]/.test(passwordData.password)) {
      nextErrors.password = 'Password must contain one uppercase letter and one number.';
    }
    if (passwordData.confirmPassword !== passwordData.password) {
      nextErrors.confirmPassword = 'Password confirmation does not match.';
    }

    if (!token) {
      nextErrors.token = 'Reset token is missing.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setMessage({ type: 'error', text: 'Please correct the highlighted fields.' });
      return;
    }

    setSubmitting(true);
    setErrors({});
    setMessage(null);

    try {
      await confirmPasswordReset({
        token,
        password: passwordData.password,
        confirmPassword: passwordData.confirmPassword,
      });
      setPasswordData({ password: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password has been reset. Redirecting to login...' });
      onSuccess?.();
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
            : 'Failed to reset password. Please request a new reset link.',
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
    passwordData,
    setPasswordData: (field: 'password' | 'confirmPassword', value: string) => {
      setPasswordData((previous) => ({ ...previous, [field]: value }));
      setErrors((prev) => clearFieldError(prev, field));
    },
    handleConfirmSubmit,
  };
}
