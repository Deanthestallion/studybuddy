import type { Request, Response } from 'express';
import { ok } from '../../utils/http';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  async home(req: Request, res: Response) {
    return ok(res, await dashboardService.getDashboard(req.user!.id));
  },
  async analytics(req: Request, res: Response) {
    const range = (req.query as { range: '7d' | '30d' | '90d' }).range;
    return ok(res, await dashboardService.getAnalytics(req.user!.id, range));
  },
};
