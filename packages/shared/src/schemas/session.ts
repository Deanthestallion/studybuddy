import { z } from 'zod';

/** A logged study/pomodoro session. Powers analytics + XP/streak. */
export const createSessionSchema = z.object({
  subjectId: z.string().cuid().nullish(),
  durationSec: z.number().int().min(1).max(86_400),
  kind: z.enum(['POMODORO', 'FREEFORM']).default('POMODORO'),
  startedAt: z.string().datetime().optional(),
});
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const analyticsRangeSchema = z.object({
  range: z.enum(['7d', '30d', '90d']).default('7d'),
});
export type AnalyticsRange = z.infer<typeof analyticsRangeSchema>;
