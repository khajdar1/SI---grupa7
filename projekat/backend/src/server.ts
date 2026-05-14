import { createServer } from 'node:http';

import { env } from './config/env';
import { prisma } from './config/database';
import { createApp } from './app';
import { initSocket } from './realtime/socket';
import { logger } from './shared/logger';

const app = createApp();
const server = createServer(app);

initSocket(server);

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('Database connection established');

    server.listen(env.PORT, () => {
      logger.info('Backend service started', {
        port: env.PORT,
        nodeEnv: env.NODE_ENV,
      });
    });
  } catch (error) {
    logger.error('Backend startup failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: env.NODE_ENV === 'production' || !(error instanceof Error) ? undefined : error.stack,
    });

    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    errorName: error.name,
    errorMessage: error.message,
    stack: env.NODE_ENV === 'production' ? undefined : error.stack,
  });
  process.exit(1);
});

startServer();
