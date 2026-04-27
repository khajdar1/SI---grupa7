import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import Cookies from 'js-cookie';

export function useLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: "", password: "" });
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
      setServerError("Please fill in both fields.");
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
    submitting,
    serverError,
    handleChange,
    handleSubmit,
    handleLogout,
  };
}