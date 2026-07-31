import { createServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { logger } from './lib/logger.js';
import { registerOrderTracking } from './realtime/tracking.js';

function main(): void {
  const env = getEnv();
  const app = createApp();
  const httpServer = createServer(app);

  const io = new SocketServer(httpServer, {
    cors: { origin: env.CORS_ORIGINS === '*' ? true : env.CORS_ORIGINS.split(',') },
  });
  registerOrderTracking(io);

  httpServer.listen(env.PORT, () => {
    logger.info(`FoodStra API listening on :${env.PORT}`);
  });
}

main();
