import type { User } from '@prisma/client';
import type { PublicUser } from '@studybuddy/shared';

/** Strip secrets and normalize dates → the client-safe user shape. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === 'ADMIN' ? 'ADMIN' : 'STUDENT',
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    theme: user.theme === 'light' ? 'light' : 'dark',
    createdAt: user.createdAt.toISOString(),
  };
}
