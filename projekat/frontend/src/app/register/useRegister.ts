import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { ROUTES, UI } from '@/constants';
import { register } from '@/services/auth.service';

import type { RegisterFormData, RegisterFormErrors } from './register.types';
import { validateRegisterForm } from './register.validation';

const INITIAL_FORM: RegisterFormData = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function useRegister() {
  const router = useRouter();

  const [formData, setFormData] = useState<RegisterFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validateRegisterForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      setSuccess(true);
      setTimeout(() => router.push(ROUTES.LOGIN), UI.REGISTER_REDIRECT_DELAY_MS);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return {
    formData,
    errors,
    submitting,
    serverError,
    success,
    handleChange,
    handleSubmit,
  };
}
