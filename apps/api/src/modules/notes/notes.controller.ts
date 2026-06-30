import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../utils/http';
import { notesService } from './notes.service';

export const notesController = {
  async list(req: Request, res: Response) {
    const { items, meta } = await notesService.list(req.user!.id, req.query as never);
    return ok(res, items, 200, meta);
  },
  async folders(req: Request, res: Response) {
    return ok(res, await notesService.folders(req.user!.id));
  },
  async create(req: Request, res: Response) {
    return created(res, await notesService.create(req.user!.id, req.body));
  },
  async get(req: Request, res: Response) {
    return ok(res, await notesService.get(req.user!.id, req.params.id!));
  },
  async update(req: Request, res: Response) {
    return ok(res, await notesService.update(req.user!.id, req.params.id!, req.body));
  },
  async remove(req: Request, res: Response) {
    await notesService.remove(req.user!.id, req.params.id!);
    return noContent(res);
  },
};
