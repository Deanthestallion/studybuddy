import type { CookieOptions, Request, Response } from 'express';
import { env, isProd } from '../../config/env';
import { created, ok } from '../../utils/http';
import { authService } from './auth.service';

const REFRESH_COOKIE = 'refreshToken';

const cookieOpts = (): CookieOptions => ({
  httpOnly: true,
  // SameSite=None (cross-site web↔api) requires Secure; prod is always Secure.
  secure: isProd || env.COOKIE_SAMESITE === 'none',
  sameSite: env.COOKIE_SAMESITE,
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  path: '/api/v1/auth',
  maxAge: env.REFRESH_TOKEN_TTL * 1000,
});

export const authController = {
  async register(req: Request, res: Response) {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts());
    return created(res, { user, accessToken });
  },

  async login(req: Request, res: Response) {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts());
    return ok(res, { user, accessToken });
  },

  async refresh(req: Request, res: Response) {
    const current = req.cookies?.[REFRESH_COOKIE];
    const { user, accessToken, refreshToken } = await authService.refresh(current);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts());
    return ok(res, { user, accessToken });
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { ...cookieOpts(), maxAge: undefined });
    return ok(res, { success: true });
  },

  async forgotPassword(req: Request, res: Response) {
    const result = await authService.forgotPassword(req.body.email);
    // token is only surfaced outside production to support local/e2e testing
    return ok(res, isProd ? { success: true } : { success: true, ...result });
  },

  async resetPassword(req: Request, res: Response) {
    await authService.resetPassword(req.body.token, req.body.password);
    return ok(res, { success: true });
  },

  async me(req: Request, res: Response) {
    return ok(res, await authService.me(req.user!.id));
  },
};
