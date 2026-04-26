import { z } from "zod";
 
export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName:  z.string().min(1, "Last name is required."),
  username:  z.string().min(2, "Username must be at least 2 characters."),
  email:     z.string().email("Invalid email format."),
  password:  z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter."),
  companyId: z
    .number({ invalid_type_error: "companyId must be a number." })
    .int()
    .positive()
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;