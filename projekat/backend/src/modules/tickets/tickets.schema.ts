import { z } from 'zod';

import { TICKET_CATEGORIES } from './tickets.service';

export const createTicketSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(150, 'Title must be at most 150 characters.'),
  category: z.enum([...TICKET_CATEGORIES] as [string, ...string[]], {
    errorMap: () => ({ message: `Category must be one of: ${TICKET_CATEGORIES.join(', ')}.` }),
  }),
  message: z.string().trim().min(1, 'Description is required.').max(2000, 'Description must be at most 2000 characters.'),
});

export const addMessageSchema = z.object({
  text: z.string().trim().min(1, 'Message text is required.').max(2000, 'Message must be at most 2000 characters.'),
});

export const requestAdminReviewSchema = z.object({
  adminUserId: z.number().int().positive('Admin user is required.'),
  reason: z.string().trim().min(10, 'Reason must be at least 10 characters.').max(1000, 'Reason must be at most 1000 characters.'),
});

export const blockTicketUserSchema = z.object({
  reason: z.string().trim().min(10, 'Reason must be at least 10 characters.').max(1000, 'Reason must be at most 1000 characters.'),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type RequestAdminReviewInput = z.infer<typeof requestAdminReviewSchema>;
export type BlockTicketUserInput = z.infer<typeof blockTicketUserSchema>;
