import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/tokens';

/** Require a valid access token; attaches `req.user`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(AppError.unauthorized());
  }
  const token = header.slice('Bearer '.length).trim();
  const payload = verifyAccessToken(token);
  req.user = { id: payload.sub, role: payload.role };
  next();
}

/** Require a specific role (use after requireAuth). */
export function requireRole(role: 'ADMIN') {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.user?.role !== role) return next(AppError.forbidden());
    next();
  };
}
