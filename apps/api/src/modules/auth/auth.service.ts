import type { LoginInput, RegisterInput } from '@studybuddy/shared';
import { prisma } from '../../lib/prisma';
import { sendPasswordResetEmail } from '../../lib/mailer';
import { AppError } from '../../utils/AppError';
import { hashPassword, verifyPassword } from '../../utils/password';
import { toPublicUser } from '../../utils/serialize';
import {
  consumeResetToken,
  createResetToken,
  issueRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
} from '../../utils/tokens';

function tokensFor(user: { id: string; role: string }) {
  return signAccessToken({ sub: user.id, role: user.role === 'ADMIN' ? 'ADMIN' : 'STUDENT' });
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw AppError.conflict('An account with this email already exists');

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
      },
    });

    return {
      user: toPublicUser(user),
      accessToken: tokensFor(user),
      refreshToken: await issueRefreshToken(user.id),
    };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    // Constant-ish failure path: same error whether email or password is wrong.
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw AppError.unauthorized('Invalid email or password');
    }
    return {
      user: toPublicUser(user),
      accessToken: tokensFor(user),
      refreshToken: await issueRefreshToken(user.id),
    };
  },

  async refresh(oldToken: string | undefined) {
    if (!oldToken) throw AppError.unauthorized('Missing refresh token');
    const { userId, token } = await rotateRefreshToken(oldToken);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.unauthorized('Session no longer valid');
    return {
      user: toPublicUser(user),
      accessToken: tokensFor(user),
      refreshToken: token,
    };
  },

  async logout(refreshToken: string | undefined) {
    if (refreshToken) await revokeRefreshToken(refreshToken);
  },

  /** Returns the reset token. In production this is emailed, never returned. */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always succeed to avoid leaking which emails are registered.
    if (!user) return { token: null };
    const token = await createResetToken(user.id);
    await sendPasswordResetEmail(user.email, token);
    return { token };
  },

  async resetPassword(token: string, password: string) {
    const userId = await consumeResetToken(token);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(password) },
    });
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');
    return toPublicUser(user);
  },
};
