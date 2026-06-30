import { prisma } from '../../lib/prisma';
import { cached } from '../../lib/redis';
import { toPublicUser } from '../../utils/serialize';
import { analyticsKey, dashboardKey } from './dashboard.keys';

const DASHBOARD_TTL = 30; // seconds — cheap protection against dashboard refresh storms
const ANALYTICS_TTL = 120;

export const dashboardService = {
  /** The single aggregated payload the home screen needs in one round-trip. */
  getDashboard(userId: string) {
    return cached(dashboardKey(userId), DASHBOARD_TTL, async () => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [user, subjects, openAssignments, upcoming, noteCount, deckCount, dueCards, todaySessions] =
        await Promise.all([
          prisma.user.findUniqueOrThrow({ where: { id: userId } }),
          prisma.subject.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
          prisma.assignment.count({ where: { userId, completed: false } }),
          prisma.assignment.findMany({
            where: { userId, completed: false },
            orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
            take: 5,
            include: { subject: { select: { name: true, color: true } } },
          }),
          prisma.note.count({ where: { userId } }),
          prisma.flashcardDeck.count({ where: { userId } }),
          prisma.flashcard.count({ where: { userId, dueAt: { lte: now } } }),
          prisma.studySession.aggregate({
            where: { userId, startedAt: { gte: startOfToday } },
            _sum: { durationSec: true },
          }),
        ]);

      return {
        user: toPublicUser(user),
        stats: {
          openAssignments,
          notes: noteCount,
          decks: deckCount,
          dueCards,
          todayStudyMinutes: Math.round((todaySessions._sum.durationSec ?? 0) / 60),
        },
        subjects: subjects.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          goals: s.goals,
          completed: s.completed,
          progress: s.goals ? Math.min(100, Math.round((s.completed / s.goals) * 100)) : 0,
        })),
        upcoming,
      };
    });
  },

  /** Time-series + breakdowns for the analytics page. */
  getAnalytics(userId: string, range: '7d' | '30d' | '90d') {
    return cached(analyticsKey(userId, range), ANALYTICS_TTL, async () => {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      const now = new Date();
      const since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));

      const [sessions, attempts, completed] = await Promise.all([
        prisma.studySession.findMany({
          where: { userId, startedAt: { gte: since } },
          select: { durationSec: true, startedAt: true, subjectId: true },
        }),
        prisma.quizAttempt.findMany({
          where: { userId, createdAt: { gte: since } },
          select: { score: true, total: true },
        }),
        prisma.assignment.count({ where: { userId, completed: true, completedAt: { gte: since } } }),
      ]);

      // Bucket study minutes by local day.
      const buckets = new Map<string, number>();
      for (let i = 0; i < days; i++) {
        const d = new Date(since.getFullYear(), since.getMonth(), since.getDate() + i);
        buckets.set(d.toISOString().slice(0, 10), 0);
      }
      for (const s of sessions) {
        const key = s.startedAt.toISOString().slice(0, 10);
        if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + s.durationSec);
      }

      const totalQuestions = attempts.reduce((a, x) => a + x.total, 0);
      const totalCorrect = attempts.reduce((a, x) => a + x.score, 0);

      return {
        range,
        studyMinutesByDay: [...buckets.entries()].map(([date, sec]) => ({
          date,
          minutes: Math.round(sec / 60),
        })),
        totals: {
          studyMinutes: Math.round(sessions.reduce((a, s) => a + s.durationSec, 0) / 60),
          sessions: sessions.length,
          assignmentsCompleted: completed,
          quizAccuracy: totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        },
      };
    });
  },
};
