import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { redis } from '../lib/redis';
import { AppError } from './AppError';

export interface AccessTokenPayload {
  sub: string;
  role: 'STUDENT' | 'ADMIN';
}

// ── Access tokens: stateless JWTs, verified without a datastore hit ──────────
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    return decoded as AccessTokenPayload;
  } catch {
    throw AppError.unauthorized('Invalid or expired access token');
  }
}

// ── Refresh tokens: opaque, random, stored in Redis so they are revocable ────
// and rotated on every use (detects token theft / replay).
const refreshKey = (token: string) => `refresh:${token}`;

export async function issueRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(48).toString('hex');
  await redis.set(refreshKey(token), userId, 'EX', env.REFRESH_TOKEN_TTL);
  return token;
}

export async function rotateRefreshToken(
  oldToken: string,
): Promise<{ userId: string; token: string }> {
  const userId = await redis.get(refreshKey(oldToken));
  if (!userId) throw AppError.unauthorized('Invalid or expired session');
  await redis.del(refreshKey(oldToken)); // single-use: rotation invalidates the old token
  const token = await issueRefreshToken(userId);
  return { userId, token };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await redis.del(refreshKey(token));
}

// ── Password-reset tokens: single-use, short-lived, Redis-backed ─────────────
const resetKey = (token: string) => `pwreset:${token}`;

export async function createResetToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  await redis.set(resetKey(token), userId, 'EX', env.PASSWORD_RESET_TTL);
  return token;
}

export async function consumeResetToken(token: string): Promise<string> {
  const userId = await redis.get(resetKey(token));
  if (!userId) throw AppError.badRequest('Invalid or expired reset token');
  await redis.del(resetKey(token));
  return userId;
}
