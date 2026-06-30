import type { Request, Response } from 'express';
import { created, ok } from '../../utils/http';
import { sessionsService } from './sessions.service';

export const sessionsController = {
  async create(req: Request, res: Response) {
    return created(res, await sessionsService.create(req.user!.id, req.body));
  },
  async list(req: Request, res: Response) {
    return ok(res, await sessionsService.list(req.user!.id));
  },
};
