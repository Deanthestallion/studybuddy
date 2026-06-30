import type { CreateSessionInput } from '@studybuddy/shared';
import { prisma } from '../../lib/prisma';
import { invalidate } from '../../lib/redis';
import { awardXp } from '../../utils/gamification';
import { analyticsKey, dashboardKey } from '../dashboard/dashboard.keys';

export const sessionsService = {
  async create(userId: string, input: CreateSessionInput) {
    const session = await prisma.studySession.create({
      data: {
        userId,
        subjectId: input.subjectId ?? null,
        durationSec: input.durationSec,
        kind: input.kind,
        startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
      },
    });

    // 1 XP per focused minute. Also advances the daily streak.
    const xp = Math.max(1, Math.floor(input.durationSec / 60));
    const user = await awardXp(userId, xp);

    await invalidate(
      dashboardKey(userId),
      analyticsKey(userId, '7d'),
      analyticsKey(userId, '30d'),
      analyticsKey(userId, '90d'),
    );

    return { session, awardedXp: xp, level: user.level, streak: user.streak };
  },

  list(userId: string, limit = 50) {
    return prisma.studySession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: { subject: { select: { name: true, color: true } } },
    });
  },
};
