import 'express';

declare global {
  namespace Express {
    interface Request {
      /** Populated by the auth middleware after verifying the access token. */
      user?: { id: string; role: 'STUDENT' | 'ADMIN' };
    }
  }
}

export {};
