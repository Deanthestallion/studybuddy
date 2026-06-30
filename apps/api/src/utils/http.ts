import type { Response } from 'express';

/** Standard success envelope. Lists pass `meta` for pagination. */
export function ok<T>(res: Response, data: T, status = 200, meta?: unknown): Response {
  return res.status(status).json(meta === undefined ? { data } : { data, meta });
}

export function created<T>(res: Response, data: T): Response {
  return ok(res, data, 201);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}
