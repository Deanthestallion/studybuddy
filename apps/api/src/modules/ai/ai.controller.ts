import type { Request, Response } from 'express';
import { ok } from '../../utils/http';
import { aiEnabled, aiService } from './ai.service';
import { assistantService } from './assistant.service';

export const aiController = {
  status(_req: Request, res: Response) {
    return ok(res, { enabled: aiEnabled() });
  },
  async quiz(req: Request, res: Response) {
    return ok(res, await aiService.generateQuiz(req.user!.id, req.body));
  },
  async flashcards(req: Request, res: Response) {
    return ok(res, await aiService.generateFlashcards(req.user!.id, req.body));
  },
  async note(req: Request, res: Response) {
    return ok(res, await aiService.generateNote(req.user!.id, req.body));
  },
  async summarize(req: Request, res: Response) {
    return ok(res, await aiService.summarizeNote(req.user!.id, req.body));
  },
  async assistant(req: Request, res: Response) {
    return ok(res, await assistantService.run(req.user!.id, req.body));
  },
};
