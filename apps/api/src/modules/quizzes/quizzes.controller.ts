import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../utils/http';
import { quizzesService } from './quizzes.service';

export const quizzesController = {
  async list(req: Request, res: Response) {
    return ok(res, await quizzesService.list(req.user!.id));
  },
  async create(req: Request, res: Response) {
    return created(res, await quizzesService.create(req.user!.id, req.body));
  },
  async get(req: Request, res: Response) {
    return ok(res, await quizzesService.get(req.user!.id, req.params.id!));
  },
  async update(req: Request, res: Response) {
    return ok(res, await quizzesService.update(req.user!.id, req.params.id!, req.body));
  },
  async remove(req: Request, res: Response) {
    await quizzesService.remove(req.user!.id, req.params.id!);
    return noContent(res);
  },
  async submit(req: Request, res: Response) {
    return created(res, await quizzesService.submitAttempt(req.user!.id, req.params.id!, req.body));
  },
  async attempts(req: Request, res: Response) {
    return ok(res, await quizzesService.listAttempts(req.user!.id, req.params.id!));
  },
};
