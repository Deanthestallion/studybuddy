import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';

const app = createApp();

// Hosts like Render/Fly inject the port to bind via $PORT; fall back to API_PORT.
const port = Number(process.env.PORT) || env.API_PORT;

const server = app.listen(port, () => {
  logger.info(`🚀 Study Buddy API listening on :${port} (${env.NODE_ENV})`);
});

// ── Graceful shutdown: stop taking traffic, drain, close datastores ──────────
async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully…`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      redis.disconnect();
      logger.info('Cleanup complete. Bye 👋');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  });
  // Hard-stop if connections refuse to drain.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error({ reason }, 'Unhandled rejection'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
