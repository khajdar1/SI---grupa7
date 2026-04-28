import { useState } from "react";
import { api } from "../../lib/api";

export function useResetPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setMessage({ type: 'error', text: "Please enter your email." });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await api.post("/auth/reset-password", { email });
      setMessage({ type: 'success', text: "A reset link has been sent to your inbox." });
      setEmail(""); 
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err?.response?.data?.message ?? "Failed to request reset. Please try again later." 
      });
    } finally {
      setSubmitting(false);
    }
  }

  return { email, setEmail, submitting, message, handleSubmit };
}