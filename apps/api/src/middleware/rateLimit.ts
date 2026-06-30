import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { redis } from '../lib/redis';
import { AppError } from '../utils/AppError';

/**
 * Distributed fixed-window rate limiter backed by Redis (INCR + EXPIRE).
 * Because the counter lives in Redis, the limit is enforced across *all* API
 * pods, not per-process. Keyed by user id when authenticated, else client IP.
 *
 * @param max     requests allowed per window (defaults to env)
 * @param window  window length in seconds (defaults to env)
 */
export function rateLimit(opts: { max?: number; window?: number; prefix?: string } = {}) {
  const max = opts.max ?? env.RATE_LIMIT_MAX;
  const windowSec = opts.window ?? env.RATE_LIMIT_WINDOW;
  const prefix = opts.prefix ?? 'rl';

  return async (req: Request, res: Response, next: NextFunction) => {
    const identity = req.user?.id ?? req.ip ?? 'anonymous';
    const key = `${prefix}:${identity}`;
    try {
      // Bound the check so a Redis stall can never add more than ~800ms of
      // latency; on timeout we fail open and let the request through.
      const count = await withTimeout(
        (async () => {
          const c = await redis.incr(key);
          if (c === 1) await redis.expire(key, windowSec);
          return c;
        })(),
        800,
      );
      const ttl = count === 1 ? windowSec : await withTimeout(redis.ttl(key), 800);

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
      res.setHeader('X-RateLimit-Reset', ttl);

      if (count > max) {
        return next(AppError.tooMany(`Rate limit exceeded. Retry in ${ttl}s.`));
      }
      next();
    } catch {
      // Fail open: never let a Redis blip take down the whole API.
      next();
    }
  };
}

/** Reject after `ms` so a hung datastore call can't stall the request. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('redis-timeout')), ms).unref()),
  ]);
}
