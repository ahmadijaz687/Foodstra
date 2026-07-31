import type { Server as SocketServer } from 'socket.io';
import { DriverLocationSchema, type Order } from '@foodstra/shared';
import { verifyAccessToken } from '../lib/tokens.js';
import { logger } from '../lib/logger.js';

const orderRoom = (orderId: string): string => `order:${orderId}`;

/**
 * Per-order realtime channel. Customers subscribe to their order's room;
 * drivers push location updates that fan out to subscribers.
 */
export function registerOrderTracking(io: SocketServer): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.['token'];
    if (typeof token !== 'string') {
      next(new Error('unauthorized'));
      return;
    }
    try {
      const claims = verifyAccessToken(token);
      socket.data.userId = claims.sub;
      socket.data.role = claims.role;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('order:subscribe', (orderId: unknown) => {
      if (typeof orderId === 'string') {
        void socket.join(orderRoom(orderId));
      }
    });

    socket.on('driver:location', (payload: unknown) => {
      const parsed = DriverLocationSchema.safeParse(payload);
      if (!parsed.success || socket.data.role !== 'driver') return;
      io.to(orderRoom(parsed.data.orderId)).emit('order:location', parsed.data);
    });
  });

  logger.info('Order tracking WebSocket registered');
}

/** Emit an order-status transition to everyone tracking the order. */
export function emitOrderStatus(io: SocketServer, order: Order): void {
  io.to(orderRoom(order.id)).emit('order:status', {
    orderId: order.id,
    status: order.status,
    updatedAt: order.updatedAt,
  });
}
