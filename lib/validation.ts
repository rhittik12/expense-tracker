import { z } from 'zod';

export const recurrenceValues = ['none','daily','weekly','monthly'] as const;

export const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().min(1).max(20),
  budget: z.number().nonnegative().optional()
});

export const TransactionSchema = z.object({
  categoryId: z.string().uuid().optional(),
  type: z.enum(['income','expense']),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  description: z.string().max(500).optional(),
  recurrence: z.enum(recurrenceValues).default('none'),
  occurredAt: z.string().datetime().optional()
});

export type CategoryInput = z.infer<typeof CategorySchema>;
export type TransactionInput = z.infer<typeof TransactionSchema>;
