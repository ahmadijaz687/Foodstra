import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { getEnv } from './config/env.js';
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

  // Stripe webhooks need the raw body for signature verification — mount
  // before the JSON parser.
  app.use(
    '/api/v1/webhooks',
    express.raw({ type: 'application/json' }),
    webhookRouter,
  );

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'foodstra-api', version: '0.1.0' });
  });

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
