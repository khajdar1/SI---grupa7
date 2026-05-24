import { z } from 'zod';

export const blockUserSchema = z
  .object({
    username: z.string().trim().min(1, 'Username is required.'),
    reason: z
      .string()
      .trim()
      .min(1, 'Reason is required.')
      .max(1000, 'Reason must be at most 1000 characters.'),
  })
  .strict();

export type BlockUserInput = z.infer<typeof blockUserSchema>;
