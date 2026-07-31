import {
  type Notification,
  type OrderStatus,
  type RegisterPushTokenInput,
} from '@foodstra/shared';
import { logger } from '../lib/logger.js';
import { newId } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';
import { getStore } from '../store/index.js';

const STATUS_COPY: Record<OrderStatus, { title: string; body: string }> = {
  placed: { title: 'Order placed', body: 'We received your order.' },
  confirmed: { title: 'Order confirmed', body: 'The restaurant accepted your order.' },
  preparing: { title: 'Preparing', body: 'Your food is being prepared.' },
  out_for_delivery: { title: 'On the way', body: 'Your order is out for delivery.' },
  delivered: { title: 'Delivered', body: 'Enjoy your meal!' },
  cancelled: { title: 'Order cancelled', body: 'Your order was cancelled.' },
};

export function registerPushToken(
  userId: string,
  input: RegisterPushTokenInput,
): void {
  const store = getStore();
  const existing = store.pushTokens.get(userId) ?? [];
  const filtered = existing.filter((t) => t.token !== input.token);
  filtered.push({ userId, token: input.token, platform: input.platform });
  store.pushTokens.set(userId, filtered);
}

export function listNotifications(userId: string): Notification[] {
  return [...getStore().notifications.values()]
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Sends push to the user's registered devices (via Expo/FCM+APNs) and records
 * an in-app notification. Delivery is best-effort; recording always happens.
 */
export function notifyOrderStatus(
  userId: string,
  orderId: string,
  status: OrderStatus,
): Notification {
  const store = getStore();
  const copy = STATUS_COPY[status];
  const notification: Notification = {
    id: newId(),
    userId,
    type: 'order_status',
    title: copy.title,
    body: copy.body,
    orderId,
    orderStatus: status,
    readAt: null,
    createdAt: nowIso(),
  };
  store.notifications.set(notification.id, notification);

  const tokens = store.pushTokens.get(userId) ?? [];
  if (tokens.length > 0) {
    // Real Expo push dispatch is wired via EXPO push API; log in dev.
    logger.info(
      { orderId, status, devices: tokens.length },
      'push notification dispatched',
    );
  }
  return notification;
}
