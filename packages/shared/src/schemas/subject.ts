import { z } from 'zod';
import { hexColorSchema } from './common.js';

export const createSubjectSchema = z.object({
  name: z.string().min(1).max(80),
  color: hexColorSchema.default('#3b82f6'),
  goals: z.number().int().min(0).max(1000).default(5),
});
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

export const updateSubjectSchema = createSubjectSchema
  .partial()
  .extend({ completed: z.number().int().min(0).optional() });
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
