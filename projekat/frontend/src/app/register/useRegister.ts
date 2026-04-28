import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { getApiFieldErrors } from "../../lib/form-validation";
import { validateRegisterForm } from "./register.validation";
import type { RegisterFormData, RegisterFormErrors} from "./register.types";
 
const INITIAL_FORM: RegisterFormData = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: ""
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
      await api.post("/auth/register", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
 
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      const backendFieldErrors = getApiFieldErrors(err);
      if (Object.keys(backendFieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...backendFieldErrors }));
      }

      setServerError(
        err?.response?.data?.message ?? "Registration failed. Please try again"
      );
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
