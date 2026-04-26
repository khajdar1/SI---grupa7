import type { RegisterFormData, RegisterFormErrors } from "./register.types";
 
export function validateRegisterForm(data: RegisterFormData): RegisterFormErrors {
  const errors: RegisterFormErrors = {};
 
  if (!data.firstName.trim()) errors.firstName = "Ime je obavezno.";
  if (!data.lastName.trim()) errors.lastName = "Prezime je obavezno.";
 
  if (!data.username.trim()) {
    errors.username = "Korisničko ime je obavezno.";
  } else if (data.username.length < 2) {
    errors.username = "Korisničko ime mora imati najmanje 2 znaka.";
  }
 
  if (!data.email.trim()) {
    errors.email = "Email adresa je obavezna.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Format email adrese nije ispravan.";
  }
 
  if (!data.password) {
    errors.password = "Lozinka je obavezna.";
  } else if (data.password.length < 8) {
    errors.password = "Lozinka mora imati najmanje 8 znakova.";
  } else if (!/[0-9]/.test(data.password)) {
    errors.password = "Lozinka mora sadržavati najmanje jedan broj.";
  } else if (!/[A-Z]/.test(data.password)) {
    errors.password = "Lozinka mora sadržavati najmanje jedno veliko slovo.";
  }
 
  if (!data.confirmPassword) {
    errors.confirmPassword = "Potvrda lozinke je obavezna.";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Lozinke se ne podudaraju.";
  }
 
  return errors;
}
 
export function getPasswordStrength(password: string): { level: number; label: string; color: string; } {
  if (!password) return { level: 0, label: "", color: "" };
 
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
 
  if (score <= 1) return { level: 1, label: "Slaba", color: "#ef4444" };
  if (score === 2) return { level: 2, label: "Srednja", color: "#f59e0b" };
  if (score === 3) return { level: 3, label: "Dobra", color: "#3b82f6" };
  return { level: 4, label: "Jaka", color: "#10b981" };
}