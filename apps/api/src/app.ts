import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { requestContext } from './middleware/requestContext';
import { rateLimit } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/error';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();

  // Behind a load balancer / reverse proxy: trust X-Forwarded-* for real client IP.
  app.set('trust proxy', 1);

  // Security headers + CORS (credentialed so the refresh cookie flows).
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestContext);

  // Liveness probe (cheap, unauthenticated, not rate limited).
  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  // Global baseline rate limit; auth routes layer a stricter limit on top.
  app.use('/api/v1', rateLimit(), apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
