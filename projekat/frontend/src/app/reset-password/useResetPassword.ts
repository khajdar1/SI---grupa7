import { useState } from "react";
import { api } from "../../lib/api";
import { getApiFieldErrors, validateEmail } from "../../lib/form-validation";

export function useResetPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(
      email,
      "Email is required.",
      "Enter a valid email address.",
    );

    if (emailError) {
      setErrors({ email: emailError });
      setMessage({ type: 'error', text: "Please correct the highlighted fields." });
      return;
    }

    setSubmitting(true);
    setErrors({});
    setMessage(null);
    try {
      await api.post("/auth/reset-password", { email });
      setMessage({ type: 'success', text: "A reset link has been sent to your inbox." });
      setEmail(""); 
    } catch (err: any) {
      const backendFieldErrors = getApiFieldErrors(err);
      if (Object.keys(backendFieldErrors).length > 0) {
        setErrors(backendFieldErrors);
      }

      setMessage({ 
        type: 'error', 
        text: err?.response?.data?.message ?? "Failed to request reset. Please try again later." 
      });
    } finally {
      setSubmitting(false);
    }
  }

  return {
    email,
    setEmail: (value: string) => {
      setEmail(value);
      setErrors((prev) => {
        if (!prev.email) {
          return prev;
        }

        const nextErrors = { ...prev };
        delete nextErrors.email;
        return nextErrors;
      });
    },
    errors,
    submitting,
    message,
    handleSubmit,
  };
}
