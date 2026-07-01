import { z } from 'zod';

/** AI generation can draw from a free-text topic or from an existing note. */
export const aiSourceEnum = z.enum(['topic', 'note']);
export const aiDifficultyEnum = z.enum(['easy', 'medium', 'hard']);
export type AiDifficulty = z.infer<typeof aiDifficultyEnum>;

const SOURCE_ERROR = {
  message: 'Provide a topic (source=topic) or a noteId (source=note)',
  path: ['source'],
};

export const generateQuizSchema = z
  .object({
    source: aiSourceEnum,
    topic: z.string().max(300).optional(),
    noteId: z.string().cuid().optional(),
    subjectId: z.string().cuid().nullish(),
    count: z.coerce.number().int().min(1).max(20).default(5),
    difficulty: aiDifficultyEnum.default('medium'),
    optionsPerQuestion: z.coerce.number().int().min(2).max(6).default(4),
  })
  .refine((v) => (v.source === 'topic' ? !!v.topic?.trim() : !!v.noteId), SOURCE_ERROR);
export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;

export const generateFlashcardsSchema = z
  .object({
    source: aiSourceEnum,
    topic: z.string().max(300).optional(),
    noteId: z.string().cuid().optional(),
    subjectId: z.string().cuid().nullish(),
    count: z.coerce.number().int().min(1).max(30).default(10),
  })
  .refine((v) => (v.source === 'topic' ? !!v.topic?.trim() : !!v.noteId), SOURCE_ERROR);
export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;

export const noteLengthEnum = z.enum(['short', 'medium', 'long']);
export type NoteLength = z.infer<typeof noteLengthEnum>;

/** Generate a study note (explainer) from a topic. */
export const generateNoteSchema = z.object({
  topic: z.string().min(1).max(300),
  subjectId: z.string().cuid().nullish(),
  length: noteLengthEnum.default('medium'),
});
export type GenerateNoteInput = z.infer<typeof generateNoteSchema>;

/** Summarize an existing note to make sense of it. */
export const summarizeNoteSchema = z.object({
  noteId: z.string().cuid(),
  style: z.enum(['bullets', 'paragraph']).default('bullets'),
});
export type SummarizeNoteInput = z.infer<typeof summarizeNoteSchema>;

/** The AI planner agent: a free-form goal the assistant fulfills using app tools. */
export const assistantSchema = z.object({
  prompt: z.string().min(1).max(2000),
});
export type AssistantInput = z.infer<typeof assistantSchema>;

export type AssistantActionType =
  | 'subject'
  | 'assignment'
  | 'note'
  | 'deck'
  | 'quiz';
export interface AssistantAction {
  type: AssistantActionType;
  label: string;
  id?: string;
}
export interface AssistantResult {
  message: string;
  actions: AssistantAction[];
}
