import type { RegisterFormData, RegisterFormErrors } from "./register.types";
import { validateEmail, validateSafeText } from "../../lib/form-validation";
 
export function validateRegisterForm(data: RegisterFormData): RegisterFormErrors {
  const errors: RegisterFormErrors = {};
 
  errors.firstName = validateSafeText(data.firstName, {
    requiredMessage: "First name is required.",
    maxLength: 100,
    maxLengthMessage: "First name must be at most 100 characters long.",
  });
  errors.lastName = validateSafeText(data.lastName, {
    requiredMessage: "Last name is required.",
    maxLength: 100,
    maxLengthMessage: "Last name must be at most 100 characters long.",
  });
  errors.username = validateSafeText(data.username, {
    requiredMessage: "Username is required.",
    minLength: 2,
    minLengthMessage: "Username must be at least 2 characters long.",
    maxLength: 50,
    maxLengthMessage: "Username must be at most 50 characters long.",
  });
  errors.email = validateEmail(
    data.email,
    "Email address is required.",
    "Invalid email format.",
  );
 
  if (!data.password) {
    errors.password = "Password is required.";
  } else if (data.password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  } else if (!/[0-9]/.test(data.password)) {
    errors.password = "Password must contain at least one number.";
  } else if (!/[A-Z]/.test(data.password)) {
    errors.password = "Password must contain at least one uppercase letter.";
  }
 
  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
 
  return Object.fromEntries(
    Object.entries(errors).filter(([, value]) => typeof value === "string" && value.length > 0),
  );
}
 
export function getPasswordStrength(password: string): { level: number; label: string; color: string; } {
  if (!password) return { level: 0, label: "", color: "" };
 
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
 
  if (score <= 1) return { level: 1, label: "Weak", color: "#ef4444" };
  if (score === 2) return { level: 2, label: "Fair", color: "#f59e0b" };
  if (score === 3) return { level: 3, label: "Good", color: "#3b82f6" };
  return { level: 4, label: "Strong", color: "#10b981" };
}
