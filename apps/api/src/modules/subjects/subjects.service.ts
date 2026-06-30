import type { CreateSubjectInput, UpdateSubjectInput } from '@studybuddy/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { invalidate } from '../../lib/redis';
import { dashboardKey } from '../dashboard/dashboard.keys';

export const subjectsService = {
  list(userId: string) {
    return prisma.subject.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  },

  create(userId: string, input: CreateSubjectInput) {
    return prisma.subject
      .create({ data: { ...input, userId } })
      .then(async (s) => {
        await invalidate(dashboardKey(userId));
        return s;
      });
  },

  async get(userId: string, id: string) {
    const subject = await prisma.subject.findFirst({ where: { id, userId } });
    if (!subject) throw AppError.notFound('Subject not found');
    return subject;
  },

  async update(userId: string, id: string, input: UpdateSubjectInput) {
    await this.get(userId, id); // ownership guard
    const updated = await prisma.subject.update({ where: { id }, data: input });
    await invalidate(dashboardKey(userId));
    return updated;
  },

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await prisma.subject.delete({ where: { id } });
    await invalidate(dashboardKey(userId));
  },
};
