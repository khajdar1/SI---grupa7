import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { ROUTES, UI } from '@/constants';
import { login, logout } from '@/services/auth.service';

export function useLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setServerError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setServerError('Please fill in both fields.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await login(formData);

      Cookies.set('token', response.accessToken, { expires: UI.SESSION_COOKIE_DAYS, path: '/' });
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      router.push(ROUTES.DASHBOARD);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Login failed. Please check your credentials.');
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
    submitting,
    serverError,
    handleChange,
    handleSubmit,
    handleLogout,
  };
}
