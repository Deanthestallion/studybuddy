import { Redis } from 'ioredis';
import RedisMock from 'ioredis-mock';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Shared Redis connection. Used for: refresh-token store, password-reset tokens,
 * rate limiting, and cache-aside for dashboard/analytics. Keeping this state in
 * Redis (not process memory) is what makes the API tier horizontally scalable.
 *
 * Set REDIS_MOCK=1 for zero-setup local dev: an in-memory, API-compatible Redis
 * so the app runs with no external services. Production uses real Redis.
 */
const useMock = process.env.REDIS_MOCK === '1';

export const redis: Redis = useMock
  ? (new RedisMock() as unknown as Redis)
  : new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      // Reject (rather than hang) if Redis is unreachable, so callers can fail
      // open/closed deliberately instead of stalling the request indefinitely.
      commandTimeout: 3000,
      enableReadyCheck: true,
      lazyConnect: false,
    });

if (useMock) logger.info('Using in-memory Redis (REDIS_MOCK=1)');
redis.on('error', (err) => logger.error({ err }, 'Redis error'));
redis.on('connect', () => logger.debug('Redis connected'));

/** Cache-aside helper: return cached JSON or compute, store, and return it. */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  produce: () => Promise<T>,
): Promise<T> {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit) as T;
  const value = await produce();
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  return value;
}

/** Invalidate one or more cache keys (call after writes). */
export async function invalidate(...keys: string[]): Promise<void> {
  if (keys.length) await redis.del(...keys);
}
