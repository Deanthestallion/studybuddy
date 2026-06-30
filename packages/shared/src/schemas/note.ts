import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1).max(160),
  folder: z.string().min(1).max(80).default('General'),
  content: z.string().max(100_000).default(''),
  subjectId: z.string().cuid().nullish(),
});
export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = createNoteSchema.partial();
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export const listNotesQuerySchema = z.object({
  search: z.string().max(160).optional(),
  folder: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;
