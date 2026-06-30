import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

type Source = 'body' | 'query' | 'params';

/**
 * Validate + coerce a request part against a zod schema. On success the parsed
 * (typed, defaulted) value replaces the raw one so handlers consume clean data.
 */
export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      // req.query/params are read-only getters in Express 5; assigning a fresh
      // object is safe in Express 4 and keeps the typed value downstream.
      (req as unknown as Record<string, unknown>)[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          AppError.badRequest('Validation failed', err.flatten().fieldErrors),
        );
      }
      next(err);
    }
  };
}
