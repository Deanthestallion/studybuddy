import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../utils/http';
import { flashcardsService } from './flashcards.service';

export const flashcardsController = {
  async listDecks(req: Request, res: Response) {
    return ok(res, await flashcardsService.listDecks(req.user!.id));
  },
  async createDeck(req: Request, res: Response) {
    return created(res, await flashcardsService.createDeck(req.user!.id, req.body));
  },
  async getDeck(req: Request, res: Response) {
    return ok(res, await flashcardsService.getDeck(req.user!.id, req.params.id!));
  },
  async updateDeck(req: Request, res: Response) {
    return ok(res, await flashcardsService.updateDeck(req.user!.id, req.params.id!, req.body));
  },
  async removeDeck(req: Request, res: Response) {
    await flashcardsService.removeDeck(req.user!.id, req.params.id!);
    return noContent(res);
  },

  async addCard(req: Request, res: Response) {
    return created(res, await flashcardsService.addCard(req.user!.id, req.params.id!, req.body));
  },
  async updateCard(req: Request, res: Response) {
    return ok(res, await flashcardsService.updateCard(req.user!.id, req.params.cardId!, req.body));
  },
  async removeCard(req: Request, res: Response) {
    await flashcardsService.removeCard(req.user!.id, req.params.cardId!);
    return noContent(res);
  },

  async due(req: Request, res: Response) {
    return ok(res, await flashcardsService.due(req.user!.id, req.params.id!));
  },
  async review(req: Request, res: Response) {
    return ok(
      res,
      await flashcardsService.review(req.user!.id, req.params.cardId!, req.body.grade),
    );
  },
};
