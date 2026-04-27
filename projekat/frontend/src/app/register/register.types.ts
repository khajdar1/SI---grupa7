export type RegisterFormData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};
 
export type RegisterFormErrors = Partial<Record<keyof RegisterFormData, string>>;