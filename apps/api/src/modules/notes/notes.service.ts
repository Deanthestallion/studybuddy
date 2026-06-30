import type { Prisma } from '@prisma/client';
import type { CreateNoteInput, ListNotesQuery, UpdateNoteInput } from '@studybuddy/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';

export const notesService = {
  async list(userId: string, q: ListNotesQuery) {
    const where: Prisma.NoteWhereInput = {
      userId,
      ...(q.folder ? { folder: q.folder } : {}),
      // SQLite LIKE is case-insensitive for ASCII; on Postgres add
      // `mode: 'insensitive'` to each clause for full case-insensitive search.
      ...(q.search
        ? {
            OR: [
              { title: { contains: q.search } },
              { content: { contains: q.search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.note.count({ where }),
    ]);

    return { items, meta: { page: q.page, pageSize: q.pageSize, total } };
  },

  /** Distinct folders for the sidebar. */
  async folders(userId: string) {
    const rows = await prisma.note.findMany({
      where: { userId },
      distinct: ['folder'],
      select: { folder: true },
      orderBy: { folder: 'asc' },
    });
    return rows.map((r) => r.folder);
  },

  create(userId: string, input: CreateNoteInput) {
    return prisma.note.create({ data: { ...input, subjectId: input.subjectId ?? null, userId } });
  },

  async get(userId: string, id: string) {
    const note = await prisma.note.findFirst({ where: { id, userId } });
    if (!note) throw AppError.notFound('Note not found');
    return note;
  },

  async update(userId: string, id: string, input: UpdateNoteInput) {
    await this.get(userId, id);
    return prisma.note.update({
      where: { id },
      data: { ...input, ...('subjectId' in input ? { subjectId: input.subjectId ?? null } : {}) },
    });
  },

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await prisma.note.delete({ where: { id } });
  },
};
