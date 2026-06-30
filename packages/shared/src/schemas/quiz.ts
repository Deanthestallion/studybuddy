import { z } from 'zod';

export const questionSchema = z.object({
  prompt: z.string().min(1).max(2000),
  options: z.array(z.string().min(1).max(500)).min(2).max(8),
  correctIndex: z.number().int().min(0),
}).refine((q) => q.correctIndex < q.options.length, {
  message: 'correctIndex must point to an existing option',
  path: ['correctIndex'],
});
export type QuestionInput = z.infer<typeof questionSchema>;

export const createQuizSchema = z.object({
  title: z.string().min(1).max(160),
  subjectId: z.string().cuid().nullish(),
  timeLimitSec: z.number().int().min(0).max(7200).default(0),
  questions: z.array(questionSchema).min(1).max(100),
});
export type CreateQuizInput = z.infer<typeof createQuizSchema>;

export const updateQuizSchema = createQuizSchema.partial();
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;

/** Submit answers: array of selected option indexes, aligned to question order. */
export const submitAttemptSchema = z.object({
  answers: z.array(z.number().int().min(0)),
  durationSec: z.number().int().min(0).max(7200).default(0),
});
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
