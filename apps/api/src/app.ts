import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { getEnv } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { addressRouter } from './routes/address.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { cartRouter } from './routes/cart.routes.js';
import { favoriteRouter } from './routes/favorite.routes.js';
import { menuRouter } from './routes/menu.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { orderRouter } from './routes/order.routes.js';
import { reviewRouter } from './routes/review.routes.js';
import { webhookRouter } from './routes/webhook.routes.js';

export function createApp(): Express {
  const env = getEnv();
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS === '*' ? true : env.CORS_ORIGINS.split(','),
      credentials: true,
    }),
  );
  app.use(pinoHttp({ logger }));

  // Stripe webhooks need the raw body for signature verification — mount
  // before the JSON parser.
  app.use(
    '/api/v1/webhooks',
    express.raw({ type: 'application/json' }),
    webhookRouter,
  );

  app.use(express.json({ limit: '1mb' }));

  // Both paths are served: /health for humans, /healthz for infra probes.
  app.get(['/health', '/healthz'], (_req, res) => {
    res.json({ status: 'ok', service: 'foodstra-api', version: '0.1.0' });
  });

  // Global API rate limit (per-route limiters, e.g. auth, still apply on top).
  // Disabled under test so the suite isn't throttled.
  if (env.NODE_ENV !== 'test') {
    app.use(
      '/api/v1',
      rateLimit({
        windowMs: 60 * 1000,
        limit: 300,
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  }

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/menu', menuRouter);
  app.use('/api/v1/cart', cartRouter);
  app.use('/api/v1/addresses', addressRouter);
  app.use('/api/v1/orders', orderRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/favorites', favoriteRouter);
  app.use('/api/v1/reviews', reviewRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
