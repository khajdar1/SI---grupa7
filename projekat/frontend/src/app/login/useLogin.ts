import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { clearFieldError, getApiFieldErrors, validateRequired } from "../../lib/form-validation";
import Cookies from 'js-cookie';

export function useLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: "", password: "" });
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
      username: validateRequired(formData.username, "Username is required."),
      password: validateRequired(formData.password, "Password is required."),
    };

    const filteredErrors = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => value),
    );

    if (Object.keys(filteredErrors).length > 0) {
      setErrors(filteredErrors);
      setServerError("Please correct the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/auth/login", formData);
      
      Cookies.set("token", response.data.accessToken, { expires: 1, path: '/' }); //1 dan
      localStorage.setItem("token", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      router.push("/dashboard"); // zamijeniti s odgovarajućim redirectom prema ulozi
    } catch (err: any) {
      const backendFieldErrors = getApiFieldErrors(err);
      if (Object.keys(backendFieldErrors).length > 0) {
        setErrors(backendFieldErrors);
      }

      setServerError(
        err?.response?.data?.message ?? "Login failed. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");

      if (token) {
        await api.post(
          "/auth/logout",
          { refreshToken },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch {

    } finally {
      Cookies.remove("token", { path: '/' }); 
      localStorage.clear()
      router.replace("/login");
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
