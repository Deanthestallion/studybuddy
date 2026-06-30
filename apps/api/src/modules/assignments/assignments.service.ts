import type { Prisma } from '@prisma/client';
import type {
  CreateAssignmentInput,
  ListAssignmentsQuery,
  UpdateAssignmentInput,
} from '@studybuddy/shared';
import { prisma } from '../../lib/prisma';
import { invalidate } from '../../lib/redis';
import { AppError } from '../../utils/AppError';
import { awardXp } from '../../utils/gamification';
import { dashboardKey } from '../dashboard/dashboard.keys';

const XP_COMPLETE = 75;

function toData(input: CreateAssignmentInput | UpdateAssignmentInput) {
  return {
    ...('title' in input ? { title: input.title } : {}),
    ...('subjectId' in input ? { subjectId: input.subjectId ?? null } : {}),
    ...('priority' in input ? { priority: input.priority } : {}),
    ...('dueDate' in input
      ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
      : {}),
  };
}

export const assignmentsService = {
  async list(userId: string, q: ListAssignmentsQuery) {
    const where: Prisma.AssignmentWhereInput = {
      userId,
      ...(q.status === 'open' ? { completed: false } : {}),
      ...(q.status === 'completed' ? { completed: true } : {}),
      ...(q.subjectId ? { subjectId: q.subjectId } : {}),
      ...(q.priority ? { priority: q.priority } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.assignment.count({ where }),
    ]);

    return { items, meta: { page: q.page, pageSize: q.pageSize, total } };
  },

  async create(userId: string, input: CreateAssignmentInput) {
    const assignment = await prisma.assignment.create({
      data: {
        title: input.title,
        subjectId: input.subjectId ?? null,
        priority: input.priority,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        userId,
      },
    });
    await invalidate(dashboardKey(userId));
    return assignment;
  },

  async get(userId: string, id: string) {
    const assignment = await prisma.assignment.findFirst({ where: { id, userId } });
    if (!assignment) throw AppError.notFound('Assignment not found');
    return assignment;
  },

  async update(userId: string, id: string, input: UpdateAssignmentInput) {
    const current = await this.get(userId, id);
    const completed = input.completed ?? current.completed;
    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        ...toData(input),
        ...(input.completed !== undefined
          ? { completed, completedAt: completed ? new Date() : null }
          : {}),
      },
    });
    if (input.completed && !current.completed) await awardXp(userId, XP_COMPLETE);
    await invalidate(dashboardKey(userId));
    return updated;
  },

  /** Flip completion in one call (used by the planner checkbox). */
  async toggle(userId: string, id: string) {
    const current = await this.get(userId, id);
    const completed = !current.completed;
    const updated = await prisma.assignment.update({
      where: { id },
      data: { completed, completedAt: completed ? new Date() : null },
    });
    if (completed) await awardXp(userId, XP_COMPLETE);
    await invalidate(dashboardKey(userId));
    return updated;
  },

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await prisma.assignment.delete({ where: { id } });
    await invalidate(dashboardKey(userId));
  },
};
