import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env, serveWeb } from './config/env';
import { requestContext } from './middleware/requestContext';
import { rateLimit } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/error';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();

  // Behind a load balancer / reverse proxy / tunnel: trust X-Forwarded-* for real client IP.
  app.set('trust proxy', 1);

  // Security headers. When this process also serves the SPA (all-in-one mode)
  // we relax CSP/COEP so the bundled assets + web fonts load without extra config.
  app.use(serveWeb ? helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }) : helmet());
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

  // All-in-one mode: serve the built SPA from the same origin with an
  // index.html fallback so client-side routing works on deep links.
  if (serveWeb) {
    const dist = env.WEB_DIST_PATH ?? path.resolve(process.cwd(), '../web/dist');
    app.use(express.static(dist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') return next();
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
