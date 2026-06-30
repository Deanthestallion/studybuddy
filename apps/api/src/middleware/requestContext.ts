import crypto from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger';

/**
 * Attaches a per-request id and structured request/response logging.
 * The reqId is echoed in error responses (non-prod) for traceability.
 */
export const requestContext = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers['x-request-id'];
    const id = (Array.isArray(existing) ? existing[0] : existing) || crypto.randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/api/v1/health',
  },
});
