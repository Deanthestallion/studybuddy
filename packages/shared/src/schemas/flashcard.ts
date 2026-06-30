import { z } from 'zod';

export const createDeckSchema = z.object({
  title: z.string().min(1).max(120),
  subjectId: z.string().cuid().nullish(),
});
export type CreateDeckInput = z.infer<typeof createDeckSchema>;

export const updateDeckSchema = createDeckSchema.partial();
export type UpdateDeckInput = z.infer<typeof updateDeckSchema>;

export const createCardSchema = z.object({
  front: z.string().min(1).max(2000),
  back: z.string().min(1).max(4000),
});
export type CreateCardInput = z.infer<typeof createCardSchema>;

export const updateCardSchema = createCardSchema.partial();
export type UpdateCardInput = z.infer<typeof updateCardSchema>;

/**
 * SM-2 grade: how well the user recalled the card.
 * 0 = blackout … 5 = perfect. <3 means the card lapses.
 */
export const reviewCardSchema = z.object({
  grade: z.number().int().min(0).max(5),
});
export type ReviewCardInput = z.infer<typeof reviewCardSchema>;
