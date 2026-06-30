import { prisma } from '../lib/prisma';

/** XP needed scales with level: keeps progression meaningful as users grow. */
export const levelForXp = (xp: number): number => Math.floor(xp / 500) + 1;

/**
 * Award XP and recompute level. Also maintains a daily study streak:
 * +1 if the last study day was yesterday, reset to 1 if a day was skipped,
 * unchanged if already counted today.
 */
export async function awardXp(userId: string, amount: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const now = new Date();
  const today = startOfDay(now);
  const last = user.lastStudyDate ? startOfDay(user.lastStudyDate) : null;

  let streak = user.streak;
  if (!last) {
    streak = 1;
  } else {
    const diffDays = Math.round((today.getTime() - last.getTime()) / 86_400_000);
    if (diffDays === 1) streak += 1;
    else if (diffDays > 1) streak = 1;
    // diffDays === 0 → already studied today, keep streak
  }

  const xp = user.xp + amount;
  return prisma.user.update({
    where: { id: userId },
    data: { xp, level: levelForXp(xp), streak, lastStudyDate: now },
  });
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
