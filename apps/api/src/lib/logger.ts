import { pino } from 'pino';
import { env, isProd } from '../config/env';

/**
 * Structured JSON logging in production (machine-parseable, ships to ELK/Datadog);
 * pretty, human-readable logs in development (run unbundled via tsx).
 *
 * `PRETTY_LOGS=0` forces JSON even in dev — used when running the bundled
 * artifact locally, where pino's worker-thread pretty transport can't resolve.
 */
const usePretty = !isProd && process.env.PRETTY_LOGS !== '0';

export const logger = pino({
  level: isProd ? 'info' : 'debug',
  base: { service: 'studybuddy-api', env: env.NODE_ENV },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.passwordHash'],
    censor: '[redacted]',
  },
  transport: usePretty
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
    : undefined,
});
