import { z } from 'zod';

/** Reusable primitives shared across every resource contract. */

export const idSchema = z.string().cuid();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/** Hex color used by subjects, decks, etc. */
export const hexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, 'Must be a 6-digit hex color, e.g. #3b82f6');

export const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type Priority = z.infer<typeof priorityEnum>;
