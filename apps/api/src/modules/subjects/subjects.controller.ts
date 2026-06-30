import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../utils/http';
import { subjectsService } from './subjects.service';

export const subjectsController = {
  async list(req: Request, res: Response) {
    return ok(res, await subjectsService.list(req.user!.id));
  },
  async create(req: Request, res: Response) {
    return created(res, await subjectsService.create(req.user!.id, req.body));
  },
  async get(req: Request, res: Response) {
    return ok(res, await subjectsService.get(req.user!.id, req.params.id!));
  },
  async update(req: Request, res: Response) {
    return ok(res, await subjectsService.update(req.user!.id, req.params.id!, req.body));
  },
  async remove(req: Request, res: Response) {
    await subjectsService.remove(req.user!.id, req.params.id!);
    return noContent(res);
  },
};
