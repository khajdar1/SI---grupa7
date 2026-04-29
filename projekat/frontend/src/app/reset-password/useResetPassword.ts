import { useState } from 'react';

import { requestPasswordReset } from '@/services/auth.service';

export function useResetPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await requestPasswordReset(email);
      setMessage({ type: 'success', text: 'A reset link has been sent to your inbox.' });
      setEmail('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to request reset. Please try again later.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return { email, setEmail, submitting, message, handleSubmit };
}
