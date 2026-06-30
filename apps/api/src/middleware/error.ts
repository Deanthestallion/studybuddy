import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { logger } from '../lib/logger';
import { isProd } from '../config/env';

/** 404 for unmatched routes. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(AppError.notFound(`Route ${req.method} ${req.path} not found`));
}

/** Centralized error → standard `{ error: { code, message, details } }` JSON. */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';
  let details: unknown;

  if (err instanceof AppError) {
    status = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    code = 'BAD_REQUEST';
    message = 'Validation failed';
    details = err.flatten().fieldErrors;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 409;
      code = 'CONFLICT';
      message = 'A record with this value already exists';
    } else if (err.code === 'P2025') {
      status = 404;
      code = 'NOT_FOUND';
      message = 'Resource not found';
    } else {
      status = 400;
      code = 'DB_ERROR';
      message = 'Database request error';
    }
  }

  if (status >= 500) {
    logger.error({ err, reqId: req.id }, 'Unhandled error');
  } else {
    logger.debug({ err, reqId: req.id }, 'Handled error');
  }

  res.status(status).json({
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      ...(isProd ? {} : { reqId: req.id }),
    },
  });
}
