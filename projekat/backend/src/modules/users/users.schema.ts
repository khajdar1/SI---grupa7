import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters.').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters.').optional(),
  email: z.string().email('Invalid email format.').optional(),
  role: z.enum(['admin', 'korisnik']).optional(),
});