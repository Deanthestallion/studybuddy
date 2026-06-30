import type { CreateQuizInput, SubmitAttemptInput, UpdateQuizInput } from '@studybuddy/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { awardXp } from '../../utils/gamification';

const XP_PER_CORRECT = 10;

// `options`/`answers` are stored as JSON strings (portable across SQLite/Postgres).
const parseOptions = (q: { options: string }): string[] => {
  try {
    return JSON.parse(q.options) as string[];
  } catch {
    return [];
  }
};

function withParsedQuestions<T extends { questions: Array<{ options: string }> }>(quiz: T) {
  return {
    ...quiz,
    questions: quiz.questions.map((q) => ({ ...q, options: parseOptions(q) })),
  };
}

export const quizzesService = {
  async list(userId: string) {
    return prisma.quiz.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true, attempts: true } } },
    });
  },

  async create(userId: string, input: CreateQuizInput) {
    const quiz = await prisma.quiz.create({
      data: {
        title: input.title,
        subjectId: input.subjectId ?? null,
        timeLimitSec: input.timeLimitSec,
        userId,
        questions: {
          create: input.questions.map((q, i) => ({
            prompt: q.prompt,
            options: JSON.stringify(q.options),
            correctIndex: q.correctIndex,
            order: i,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    return withParsedQuestions(quiz);
  },

  async get(userId: string, id: string) {
    const quiz = await prisma.quiz.findFirst({
      where: { id, userId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!quiz) throw AppError.notFound('Quiz not found');
    return withParsedQuestions(quiz);
  },

  async update(userId: string, id: string, input: UpdateQuizInput) {
    await this.assert(userId, id);
    // If questions are supplied, replace the set atomically.
    const quiz = await prisma.$transaction(async (tx) => {
      if (input.questions) {
        await tx.question.deleteMany({ where: { quizId: id } });
        await tx.question.createMany({
          data: input.questions.map((q, i) => ({
            quizId: id,
            prompt: q.prompt,
            options: JSON.stringify(q.options),
            correctIndex: q.correctIndex,
            order: i,
          })),
        });
      }
      return tx.quiz.update({
        where: { id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.timeLimitSec !== undefined ? { timeLimitSec: input.timeLimitSec } : {}),
          ...('subjectId' in input ? { subjectId: input.subjectId ?? null } : {}),
        },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
    });
    return withParsedQuestions(quiz);
  },

  async remove(userId: string, id: string) {
    await this.assert(userId, id);
    await prisma.quiz.delete({ where: { id } });
  },

  async submitAttempt(userId: string, quizId: string, input: SubmitAttemptInput) {
    const quiz = await this.get(userId, quizId);
    const total = quiz.questions.length;

    let score = 0;
    const breakdown = quiz.questions.map((q, i) => {
      const chosen = input.answers[i];
      const correct = chosen === q.correctIndex;
      if (correct) score += 1;
      return { questionId: q.id, chosen: chosen ?? null, correctIndex: q.correctIndex, correct };
    });

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        score,
        total,
        answers: JSON.stringify(input.answers),
        durationSec: input.durationSec,
      },
    });

    await awardXp(userId, score * XP_PER_CORRECT);

    return {
      attemptId: attempt.id,
      score,
      total,
      percentage: total ? Math.round((score / total) * 100) : 0,
      breakdown,
    };
  },

  async listAttempts(userId: string, quizId: string) {
    await this.assert(userId, quizId);
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return attempts.map((a) => ({ ...a, answers: JSON.parse(a.answers) as number[] }));
  },

  async assert(userId: string, id: string) {
    const quiz = await prisma.quiz.findFirst({ where: { id, userId }, select: { id: true } });
    if (!quiz) throw AppError.notFound('Quiz not found');
    return quiz;
  },
};
