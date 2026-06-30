import { z } from 'zod';
import { priorityEnum } from './common.js';

export const createAssignmentSchema = z.object({
  title: z.string().min(1).max(160),
  subjectId: z.string().cuid().nullish(),
  dueDate: z.string().datetime().nullish(),
  priority: priorityEnum.default('MEDIUM'),
});
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const updateAssignmentSchema = createAssignmentSchema
  .partial()
  .extend({ completed: z.boolean().optional() });
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

export const listAssignmentsQuerySchema = z.object({
  status: z.enum(['all', 'open', 'completed']).default('all'),
  subjectId: z.string().cuid().optional(),
  priority: priorityEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListAssignmentsQuery = z.infer<typeof listAssignmentsQuerySchema>;
