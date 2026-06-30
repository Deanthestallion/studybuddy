import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../utils/http';
import { assignmentsService } from './assignments.service';

export const assignmentsController = {
  async list(req: Request, res: Response) {
    const { items, meta } = await assignmentsService.list(req.user!.id, req.query as never);
    return ok(res, items, 200, meta);
  },
  async create(req: Request, res: Response) {
    return created(res, await assignmentsService.create(req.user!.id, req.body));
  },
  async get(req: Request, res: Response) {
    return ok(res, await assignmentsService.get(req.user!.id, req.params.id!));
  },
  async update(req: Request, res: Response) {
    return ok(res, await assignmentsService.update(req.user!.id, req.params.id!, req.body));
  },
  async toggle(req: Request, res: Response) {
    return ok(res, await assignmentsService.toggle(req.user!.id, req.params.id!));
  },
  async remove(req: Request, res: Response) {
    await assignmentsService.remove(req.user!.id, req.params.id!);
    return noContent(res);
  },
};
