import { z } from 'zod';
import type {
  GenerateFlashcardsInput,
  GenerateNoteInput,
  GenerateQuizInput,
  SummarizeNoteInput,
} from '@studybuddy/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { aiEnabled, generateJson } from './providers';

export { aiEnabled };

// ── Structured-output contracts ──────────────────────────────────────────────
// zod schemas validate the model's reply; the matching JSON Schemas constrain
// the output (OpenAI Structured Outputs / Anthropic output_config.format).
// `additionalProperties: false` + `required` are mandatory for strict mode.
const quizOut = z.object({
  questions: z.array(
    z.object({
      prompt: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number().int(),
    }),
  ),
});
const QUIZ_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['questions'],
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['prompt', 'options', 'correctIndex'],
        properties: {
          prompt: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer' },
        },
      },
    },
  },
};

const cardsOut = z.object({
  cards: z.array(z.object({ front: z.string(), back: z.string() })),
});
const CARDS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['cards'],
  properties: {
    cards: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['front', 'back'],
        properties: { front: { type: 'string' }, back: { type: 'string' } },
      },
    },
  },
};

const noteOut = z.object({ title: z.string(), content: z.string() });
const NOTE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'content'],
  properties: { title: { type: 'string' }, content: { type: 'string' } },
};

const LENGTH_GUIDE: Record<string, string> = {
  short: 'about 120–180 words',
  medium: 'about 300–400 words',
  long: 'about 600–800 words',
};

/** Ask the configured provider for JSON, then validate it with the zod schema. */
async function generate<T extends z.ZodTypeAny>(
  schema: T,
  jsonSchema: Record<string, unknown>,
  schemaName: string,
  system: string,
  content: string,
): Promise<z.infer<T>> {
  const raw = await generateJson({ system, content, jsonSchema, schemaName });
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError(502, 'AI_PARSE_FAILED', 'The model returned malformed output. Retry.');
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new AppError(502, 'AI_PARSE_FAILED', 'The model returned unexpected output. Retry.');
  }
  return result.data;
}

/** Resolve the grounding material. Note text is loaded server-side (ownership-checked). */
async function resolveSource(
  userId: string,
  input: { source: 'topic' | 'note'; topic?: string; noteId?: string; subjectId?: string | null },
): Promise<string> {
  if (input.source === 'note') {
    const note = await prisma.note.findFirst({ where: { id: input.noteId!, userId } });
    if (!note) throw AppError.notFound('Note not found');
    return `Title: ${note.title}\n\n${note.content}`.slice(0, 12_000); // bound token usage
  }
  let subjectSuffix = '';
  if (input.subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: input.subjectId, userId },
      select: { name: true },
    });
    if (subject) subjectSuffix = ` (subject area: ${subject.name})`;
  }
  return `Topic: ${input.topic}${subjectSuffix}`;
}

export const aiService = {
  async generateQuiz(userId: string, input: GenerateQuizInput) {
    const material = await resolveSource(userId, input);
    const system = `You are an expert educator writing study quizzes. Create exactly ${input.count} multiple-choice questions at ${input.difficulty} difficulty, grounded strictly in the material provided.
Rules:
- Each question has exactly ${input.optionsPerQuestion} answer options.
- Exactly one option is correct; set correctIndex to its 0-based position.
- Make distractors plausible, mutually exclusive, and similar in length to the answer.
- Cover distinct key concepts; never repeat a question.
Respond ONLY with JSON of the form: {"questions":[{"prompt":string,"options":string[],"correctIndex":number}]}. No prose, no explanations.`;

    const out = await generate(quizOut, QUIZ_JSON_SCHEMA, 'quiz', system, material);

    const questions = out.questions
      .map((q) => {
        const options = q.options
          .map((o) => String(o).trim())
          .filter(Boolean)
          .slice(0, input.optionsPerQuestion);
        const correctIndex =
          Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < options.length
            ? q.correctIndex
            : 0;
        return { prompt: (q.prompt ?? '').trim(), options, correctIndex };
      })
      .filter((q) => q.prompt && q.options.length >= 2)
      .slice(0, input.count);

    if (questions.length === 0) {
      throw new AppError(502, 'AI_EMPTY', 'No valid questions were generated. Try a richer topic.');
    }
    return { questions };
  },

  async generateFlashcards(userId: string, input: GenerateFlashcardsInput) {
    const material = await resolveSource(userId, input);
    const system = `You are an expert educator writing flashcards for spaced-repetition study. Create exactly ${input.count} flashcards grounded strictly in the material provided.
Rules:
- "front" is a concise question or prompt; "back" is the correct, self-contained answer.
- One idea per card; cover distinct key concepts; never duplicate.
Respond ONLY with JSON of the form: {"cards":[{"front":string,"back":string}]}. No prose, no explanations.`;

    const out = await generate(cardsOut, CARDS_JSON_SCHEMA, 'flashcards', system, material);

    const cards = out.cards
      .map((c) => ({ front: (c.front ?? '').trim(), back: (c.back ?? '').trim() }))
      .filter((c) => c.front && c.back)
      .slice(0, input.count);

    if (cards.length === 0) {
      throw new AppError(502, 'AI_EMPTY', 'No valid cards were generated. Try a richer topic.');
    }
    return { cards };
  },

  /** Write a study note (explainer) on a topic, for the student to learn from. */
  async generateNote(userId: string, input: GenerateNoteInput) {
    let subjectSuffix = '';
    if (input.subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: input.subjectId, userId },
        select: { name: true },
      });
      if (subject) subjectSuffix = ` within the subject "${subject.name}"`;
    }
    const system = `You are an expert tutor writing clear, accurate study notes a student can learn from. Write notes on the requested topic${subjectSuffix}, ${LENGTH_GUIDE[input.length]}.
Rules:
- Start with a one-line overview, then organized sections.
- Use Markdown: short headings (##), bullet points, and **bold** for key terms.
- Be accurate and concrete; include key definitions, mechanisms, and a couple of examples.
- No filler or meta-commentary.
Respond ONLY with JSON of the form: {"title":string,"content":string} where content is Markdown.`;

    const out = await generate(noteOut, NOTE_JSON_SCHEMA, 'note', system, `Topic: ${input.topic}`);
    const title = out.title.trim() || input.topic;
    const content = out.content.trim();
    if (!content) throw new AppError(502, 'AI_EMPTY', 'No note content was generated. Retry.');
    return { title, content };
  },

  /** Summarize an existing note to help the student make sense of it. */
  async summarizeNote(userId: string, input: SummarizeNoteInput) {
    const note = await prisma.note.findFirst({ where: { id: input.noteId, userId } });
    if (!note) throw AppError.notFound('Note not found');
    if (!note.content.trim()) throw AppError.badRequest('This note has no content to summarize.');

    const shape =
      input.style === 'bullets'
        ? 'a short overview sentence followed by 4–8 concise bullet points of the key ideas'
        : 'two or three tight paragraphs';
    const system = `You are an expert tutor. Summarize the student's note into ${shape}, making it easier to understand and remember. Keep it faithful to the source — do not invent facts. Use clear Markdown.
Respond ONLY with JSON of the form: {"title":string,"content":string}.`;

    const out = await generate(
      noteOut,
      NOTE_JSON_SCHEMA,
      'note',
      system,
      `Note title: ${note.title}\n\n${note.content}`.slice(0, 12_000),
    );
    const content = out.content.trim();
    if (!content) throw new AppError(502, 'AI_EMPTY', 'No summary was generated. Retry.');
    return { title: out.title.trim() || `Summary of ${note.title}`, content };
  },
};
