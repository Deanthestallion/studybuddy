import type {
  CreateCardInput,
  CreateDeckInput,
  UpdateCardInput,
  UpdateDeckInput,
} from '@studybuddy/shared';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { awardXp } from '../../utils/gamification';
import { sm2 } from './sm2';

const XP_REVIEW = 5;

export const flashcardsService = {
  // ── Decks ──────────────────────────────────────────────────────────────
  async listDecks(userId: string) {
    const decks = await prisma.flashcardDeck.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { cards: true } } },
    });
    // Surface how many cards are due now per deck (drives the "Review" badge).
    const due = await prisma.flashcard.groupBy({
      by: ['deckId'],
      where: { userId, dueAt: { lte: new Date() } },
      _count: { _all: true },
    });
    const dueByDeck = new Map(due.map((d) => [d.deckId, d._count._all]));
    return decks.map((d) => ({
      id: d.id,
      title: d.title,
      subjectId: d.subjectId,
      cardCount: d._count.cards,
      dueCount: dueByDeck.get(d.id) ?? 0,
      createdAt: d.createdAt,
    }));
  },

  createDeck(userId: string, input: CreateDeckInput) {
    return prisma.flashcardDeck.create({
      data: { title: input.title, subjectId: input.subjectId ?? null, userId },
    });
  },

  async getDeck(userId: string, id: string) {
    const deck = await prisma.flashcardDeck.findFirst({
      where: { id, userId },
      include: { cards: { orderBy: { createdAt: 'asc' } } },
    });
    if (!deck) throw AppError.notFound('Deck not found');
    return deck;
  },

  async updateDeck(userId: string, id: string, input: UpdateDeckInput) {
    await this.assertDeck(userId, id);
    return prisma.flashcardDeck.update({
      where: { id },
      data: { ...input, ...('subjectId' in input ? { subjectId: input.subjectId ?? null } : {}) },
    });
  },

  async removeDeck(userId: string, id: string) {
    await this.assertDeck(userId, id);
    await prisma.flashcardDeck.delete({ where: { id } });
  },

  // ── Cards ──────────────────────────────────────────────────────────────
  async addCard(userId: string, deckId: string, input: CreateCardInput) {
    await this.assertDeck(userId, deckId);
    return prisma.flashcard.create({ data: { ...input, deckId, userId } });
  },

  async updateCard(userId: string, id: string, input: UpdateCardInput) {
    await this.assertCard(userId, id);
    return prisma.flashcard.update({ where: { id }, data: input });
  },

  async removeCard(userId: string, id: string) {
    await this.assertCard(userId, id);
    await prisma.flashcard.delete({ where: { id } });
  },

  // ── Spaced repetition ──────────────────────────────────────────────────
  async due(userId: string, deckId: string) {
    await this.assertDeck(userId, deckId);
    return prisma.flashcard.findMany({
      where: { userId, deckId, dueAt: { lte: new Date() } },
      orderBy: { dueAt: 'asc' },
    });
  },

  async review(userId: string, cardId: string, grade: number) {
    const card = await this.assertCard(userId, cardId);
    const next = sm2(
      { easeFactor: card.easeFactor, intervalDays: card.intervalDays, repetitions: card.repetitions },
      grade,
    );
    const updated = await prisma.flashcard.update({
      where: { id: cardId },
      data: {
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        dueAt: next.dueAt,
        lastReviewedAt: new Date(),
      },
    });
    await awardXp(userId, XP_REVIEW);
    return updated;
  },

  // ── Ownership guards ───────────────────────────────────────────────────
  async assertDeck(userId: string, id: string) {
    const deck = await prisma.flashcardDeck.findFirst({ where: { id, userId } });
    if (!deck) throw AppError.notFound('Deck not found');
    return deck;
  },
  async assertCard(userId: string, id: string) {
    const card = await prisma.flashcard.findFirst({ where: { id, userId } });
    if (!card) throw AppError.notFound('Card not found');
    return card;
  },
};
