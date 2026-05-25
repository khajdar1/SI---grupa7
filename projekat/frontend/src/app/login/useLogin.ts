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
import { translateText, useI18n } from '@/lib/i18n';
import { login, logout } from '@/services/auth.service';
import { getMyProfile, updateMyProfile } from '@/services/profile.service';

function getTokenRoles(token: string): string[] {
  try {
    const payload = JSON.parse(window.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      realm_access?: { roles?: string[] };
      resource_access?: Record<string, { roles?: string[] }>;
    };

    const realmRoles = payload.realm_access?.roles ?? [];
    const clientRoles = Object.values(payload.resource_access ?? {}).flatMap((access) => access.roles ?? []);
    return [...realmRoles, ...clientRoles].map((role) => role.toLowerCase());
  } catch {
    return [];
  }
}

function getPostLoginRoute(accessToken: string): string {
  const roles = getTokenRoles(accessToken);
  const isCompanyAdmin = roles.includes('kompanijaadmin') || roles.includes('companyadmin');
  const isSystemAdmin = roles.includes('admin') || roles.includes('administrator');

  if (isCompanyAdmin && !isSystemAdmin) {
    return ROUTES.COMPANY;
  }

  return ROUTES.DASHBOARD;
}

export function useLogin() {
  const router = useRouter();
  const { language, setLanguage, t } = useI18n();
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
      username: validateRequired(formData.username, t('validation.usernameRequired')),
      password: validateRequired(formData.password, t('validation.passwordRequired')),
    };

    const filteredErrors = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => value),
    );

    if (Object.keys(filteredErrors).length > 0) {
      setErrors(filteredErrors);
      setServerError(t('profile.correctFields'));
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
      if (response.user.language) {
        localStorage.setItem('language', response.user.language);
        setLanguage(response.user.language, { persistToProfile: false });
      }

      router.push(getPostLoginRoute(response.accessToken));
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
          ? translateText(language, error.message)
          : t('login.failed'),
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
        try {
          const profile = await getMyProfile();
          if (profile.language !== language) {
            await updateMyProfile({
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email,
              language,
            });
          }
        } catch {
          // The navbar persists language immediately; this is a best-effort fallback before session cleanup.
        }

        await logout({ token, refreshToken });
      }
    } catch {
      // Intentionally swallow network logout errors and clear local session.
    } finally {
      Cookies.remove('token', { path: '/' });
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
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
