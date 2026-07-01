import type OpenAI from 'openai';
import type { AssistantAction, AssistantInput, AssistantResult } from '@studybuddy/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../lib/logger';
import { assignmentsService } from '../assignments/assignments.service';
import { flashcardsService } from '../flashcards/flashcards.service';
import { notesService } from '../notes/notes.service';
import { quizzesService } from '../quizzes/quizzes.service';
import { subjectsService } from '../subjects/subjects.service';
import { getOpenAIClient, openaiModel } from './providers';

const MAX_ITERATIONS = 8; // model ↔ tool round-trips
const MAX_ACTIONS = 40; // safety cap on items created in one run
const PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

// ── Tool definitions exposed to the model ────────────────────────────────────
const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_subject',
      description: 'Create a study subject to organize work under. Reuse existing subjects by name when possible.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          color: { type: 'string', description: '6-digit hex like #3b82f6 (optional)' },
          goals: { type: 'integer', description: 'target number of tasks (optional)' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_assignment',
      description: 'Create an assignment/task. Set dueDate to schedule it on a specific day.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          subjectName: { type: 'string', description: 'subject to file it under (optional)' },
          dueDate: { type: 'string', description: 'ISO date YYYY-MM-DD (optional)' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_note',
      description: 'Create a study note. You write the full content yourself (accurate Markdown).',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string', description: 'Markdown study content' },
          folder: { type: 'string' },
          subjectName: { type: 'string' },
        },
        required: ['title', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_flashcard_deck',
      description: 'Create a flashcard deck. You write the cards yourself.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          subjectName: { type: 'string' },
          cards: {
            type: 'array',
            items: {
              type: 'object',
              properties: { front: { type: 'string' }, back: { type: 'string' } },
              required: ['front', 'back'],
            },
          },
        },
        required: ['title', 'cards'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_quiz',
      description: 'Create a multiple-choice quiz. You write the questions yourself.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          subjectName: { type: 'string' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                prompt: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                correctIndex: { type: 'integer' },
              },
              required: ['prompt', 'options', 'correctIndex'],
            },
          },
        },
        required: ['title', 'questions'],
      },
    },
  },
];

interface Ctx {
  userId: string;
  actions: AssistantAction[];
  subjects: Map<string, string>; // lowercased name -> id
}

const str = (v: unknown, max = 4000) => String(v ?? '').trim().slice(0, max);
const priorityOf = (p: unknown) =>
  p === 'LOW' || p === 'HIGH' ? p : 'MEDIUM';
const hexOf = (c: unknown, i: number) =>
  typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : PALETTE[i % PALETTE.length]!;

/** Find an existing subject by name (case-insensitive) or create it; cache the id. */
async function resolveSubject(ctx: Ctx, name?: unknown): Promise<string | null> {
  const clean = str(name, 80);
  if (!clean) return null;
  const key = clean.toLowerCase();
  const cached = ctx.subjects.get(key);
  if (cached) return cached;
  const subject = await subjectsService.create(ctx.userId, {
    name: clean,
    color: PALETTE[ctx.subjects.size % PALETTE.length]!,
    goals: 5,
  });
  ctx.subjects.set(key, subject.id);
  ctx.actions.push({ type: 'subject', label: `Subject “${subject.name}”`, id: subject.id });
  return subject.id;
}

async function runTool(ctx: Ctx, name: string, args: Record<string, unknown>): Promise<unknown> {
  if (ctx.actions.length >= MAX_ACTIONS) return { error: 'Action limit reached; stop creating items.' };

  switch (name) {
    case 'create_subject': {
      const id = await resolveSubject(ctx, args.name); // creates + logs if new
      return { ok: true, subjectId: id };
    }
    case 'create_assignment': {
      const subjectId = await resolveSubject(ctx, args.subjectName);
      const a = await assignmentsService.create(ctx.userId, {
        title: str(args.title, 160),
        subjectId,
        dueDate: args.dueDate ? new Date(String(args.dueDate)).toISOString() : null,
        priority: priorityOf(args.priority),
      });
      ctx.actions.push({
        type: 'assignment',
        label: `${a.title}${a.dueDate ? ` (due ${new Date(a.dueDate).toLocaleDateString()})` : ''}`,
        id: a.id,
      });
      return { ok: true, id: a.id };
    }
    case 'create_note': {
      const subjectId = await resolveSubject(ctx, args.subjectName);
      const n = await notesService.create(ctx.userId, {
        title: str(args.title, 160),
        content: str(args.content, 50_000),
        folder: str(args.folder, 80) || 'AI',
        subjectId,
      });
      ctx.actions.push({ type: 'note', label: n.title, id: n.id });
      return { ok: true, id: n.id };
    }
    case 'create_flashcard_deck': {
      const subjectId = await resolveSubject(ctx, args.subjectName);
      const deck = await flashcardsService.createDeck(ctx.userId, { title: str(args.title, 120), subjectId });
      const cards = Array.isArray(args.cards) ? args.cards.slice(0, 30) : [];
      let added = 0;
      for (const c of cards) {
        const front = str((c as Record<string, unknown>)?.front, 2000);
        const back = str((c as Record<string, unknown>)?.back, 4000);
        if (front && back) {
          await flashcardsService.addCard(ctx.userId, deck.id, { front, back });
          added += 1;
        }
      }
      ctx.actions.push({ type: 'deck', label: `${deck.title} (${added} cards)`, id: deck.id });
      return { ok: true, id: deck.id, cards: added };
    }
    case 'create_quiz': {
      const subjectId = await resolveSubject(ctx, args.subjectName);
      const questions = (Array.isArray(args.questions) ? args.questions : [])
        .slice(0, 20)
        .map((q) => {
          const r = q as Record<string, unknown>;
          const options = (Array.isArray(r.options) ? r.options : [])
            .map((o) => str(o, 500))
            .filter(Boolean)
            .slice(0, 6);
          const ci = Number(r.correctIndex);
          return {
            prompt: str(r.prompt, 2000),
            options,
            correctIndex: Number.isInteger(ci) && ci >= 0 && ci < options.length ? ci : 0,
          };
        })
        .filter((q) => q.prompt && q.options.length >= 2);
      if (questions.length === 0) return { error: 'No valid questions; provide ≥2 options each.' };
      const quiz = await quizzesService.create(ctx.userId, {
        title: str(args.title, 160),
        subjectId,
        timeLimitSec: 0,
        questions,
      });
      ctx.actions.push({ type: 'quiz', label: `${quiz.title} (${questions.length} questions)`, id: quiz.id });
      return { ok: true, id: quiz.id, questions: questions.length };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export const assistantService = {
  async run(userId: string, input: AssistantInput): Promise<AssistantResult> {
    const client = getOpenAIClient(); // 503 if AI not configured

    const existing = await prisma.subject.findMany({ where: { userId }, select: { id: true, name: true } });
    const ctx: Ctx = {
      userId,
      actions: [],
      subjects: new Map(existing.map((s) => [s.name.toLowerCase(), s.id])),
    };

    const today = new Date().toISOString().slice(0, 10);
    const subjectList = existing.length ? existing.map((s) => s.name).join(', ') : 'none yet';
    const system = `You are Study Buddy's planning assistant. The student describes a goal in plain language and you SET IT UP by calling tools — creating subjects, assignments (with due dates = scheduling), notes (you write the content), flashcard decks (you write the cards) and quizzes (you write the questions).

Guidelines:
- Be proactive and concrete: actually create the items with the tools; don't just describe a plan.
- Reuse the student's existing subjects by exact name; only create a new one if none fits.
- When given a timeframe (e.g. "this week", "before Friday"), spread assignments across sensible due dates.
- Write real, accurate content — never placeholders like "TODO".
- Keep it focused and useful: a handful of well-chosen items, not dozens.
- When finished, write a short friendly summary of what you set up (1-3 sentences).

Existing subjects: ${subjectList}.
Today's date: ${today}.`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: system },
      { role: 'user', content: input.prompt },
    ];

    let finalText = '';
    try {
      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const res = await client.chat.completions.create({
          model: openaiModel(),
          messages,
          tools: TOOLS,
          tool_choice: 'auto',
        });
        const msg = res.choices[0]?.message;
        if (!msg) break;
        messages.push(msg as OpenAI.Chat.Completions.ChatCompletionMessageParam);

        const calls = msg.tool_calls ?? [];
        if (calls.length === 0) {
          finalText = msg.content ?? '';
          break;
        }

        for (const call of calls) {
          if (call.type !== 'function') continue;
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(call.function.arguments || '{}');
          } catch {
            /* leave empty; tool will report */
          }
          let result: unknown;
          try {
            result = await runTool(ctx, call.function.name, args);
          } catch (err) {
            logger.warn({ err, tool: call.function.name }, 'assistant tool failed');
            result = { error: err instanceof AppError ? err.message : 'tool execution failed' };
          }
          messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
        }
      }
    } catch (err) {
      logger.error({ err }, 'assistant run failed');
      // If we already created things, return them with a soft message rather than 500.
      if (ctx.actions.length === 0) {
        throw new AppError(502, 'AI_ERROR', 'The assistant could not complete the request. Try again.');
      }
    }

    if (!finalText) {
      finalText = ctx.actions.length
        ? `Done — I set up ${ctx.actions.length} item${ctx.actions.length === 1 ? '' : 's'} for you.`
        : 'I wasn’t able to create anything for that request. Try being more specific about what you want to study.';
    }
    return { message: finalText, actions: ctx.actions };
  },
};
