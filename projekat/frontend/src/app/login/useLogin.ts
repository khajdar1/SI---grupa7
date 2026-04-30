'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { ROUTES, UI } from '@/constants';
import {
  clearFieldError,
  getApiFieldErrors,
  validateRequired,
} from '@/lib/form-validation';
import { login, logout } from '@/services/auth.service';

export function useLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setServerError(null);
    setErrors((prev) => clearFieldError(prev, name));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors = {
      username: validateRequired(formData.username, 'Username is required.'),
      password: validateRequired(formData.password, 'Password is required.'),
    };

    const filteredErrors = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => value),
    );

    if (Object.keys(filteredErrors).length > 0) {
      setErrors(filteredErrors);
      setServerError('Please correct the highlighted fields.');
      return;
    }

    setSubmitting(true);
    setErrors({});
    setServerError(null);

    try {
      const response = await login(formData);

      Cookies.set('token', response.accessToken, {
        expires: UI.SESSION_COOKIE_DAYS,
        path: '/',
      });
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      router.push(ROUTES.DASHBOARD);
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

      setServerError(
        error instanceof Error
          ? error.message
          : 'Login failed. Please check your credentials.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      if (token) {
        await logout({ token, refreshToken });
      }
    } catch {
      // Intentionally swallow network logout errors and clear local session.
    } finally {
      Cookies.remove('token', { path: '/' });
      localStorage.clear();
      router.replace(ROUTES.LOGIN);
    }
  }

  return {
    formData,
    errors,
    submitting,
    serverError,
    handleChange,
    handleSubmit,
    handleLogout,
  };
}
