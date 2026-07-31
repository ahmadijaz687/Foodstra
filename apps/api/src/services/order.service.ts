import {
  canTransition,
  type Order,
  type OrderItem,
  type OrderStatus,
  type Payment,
  type UserRole,
} from '@foodstra/shared';
import { BadRequest, Conflict, Forbidden, NotFound } from '../lib/errors.js';
import { newId } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';
import { getStore } from '../store/index.js';
import { getAddress } from './address.service.js';
import { getCart, clearCart } from './cart.service.js';
import { notifyOrderStatus } from './notification.service.js';
import { getPaymentProvider } from './payment/index.js';
import { emitOrderStatus } from '../realtime/hub.js';

const DELIVERY_FEE_MINOR = 299;
const TAX_RATE = 0.0875;

export interface PlacedOrder {
  order: Order;
  payment: { id: string; clientSecret: string; status: string };
}

/** Who may drive an order from one status to another. */
function assertRoleCanTransition(
  role: UserRole,
  from: OrderStatus,
  to: OrderStatus,
): void {
  if (!canTransition(from, to)) {
    throw Conflict(`Illegal transition ${from} -> ${to}`);
  }
  if (role === 'admin') return;
  if (to === 'cancelled') {
    // vendor/customer may cancel before it's out for delivery
    if (role === 'vendor' || role === 'customer') return;
    throw Forbidden('Not allowed to cancel at this stage');
  }
  const vendorAllowed: OrderStatus[] = ['confirmed', 'preparing'];
  const driverAllowed: OrderStatus[] = ['out_for_delivery', 'delivered'];
  if (role === 'vendor' && vendorAllowed.includes(to)) return;
  if (role === 'driver' && driverAllowed.includes(to)) return;
  throw Forbidden(`Role ${role} cannot set status ${to}`);
}

export async function createOrder(
  userId: string,
  userEmail: string,
  addressId: string,
  idempotencyKey: string,
): Promise<PlacedOrder> {
  const store = getStore();

  const idemKey = `${userId}:${idempotencyKey}`;
  const existingOrderId = store.orderIdempotency.get(idemKey);
  if (existingOrderId) {
    const existing = store.orders.get(existingOrderId)!;
    const pay = [...store.payments.values()].find(
      (p) => p.orderId === existing.id,
    );
    return {
      order: existing,
      payment: {
        id: pay?.stripePaymentIntentId ?? '',
        clientSecret: '',
        status: pay?.status ?? 'requires_payment',
      },
    };
  }

  const address = getAddress(userId, addressId);
  const cart = getCart(userId);
  if (cart.items.length === 0 || !cart.restaurantId) {
    throw BadRequest('Cart is empty');
  }

  const items: OrderItem[] = cart.items.map((ci) => ({
    id: newId(),
    menuItemId: ci.menuItemId,
    name: ci.name,
    unitPriceMinor: ci.unitPriceMinor,
    quantity: ci.quantity,
    ...(ci.notes !== undefined ? { notes: ci.notes } : {}),
  }));
  const subtotalMinor = cart.subtotalMinor;
  const taxMinor = Math.round(subtotalMinor * TAX_RATE);
  const totalMinor = subtotalMinor + DELIVERY_FEE_MINOR + taxMinor;

  const ts = nowIso();
  const order: Order = {
    id: newId(),
    userId,
    restaurantId: cart.restaurantId,
    driverId: null,
    addressId: address.id,
    status: 'placed',
    currency: cart.currency,
    items,
    subtotalMinor,
    deliveryFeeMinor: DELIVERY_FEE_MINOR,
    taxMinor,
    totalMinor,
    placedAt: ts,
    updatedAt: ts,
  };

  const intent = await getPaymentProvider().createPaymentIntent({
    orderId: order.id,
    amountMinor: totalMinor,
    currency: order.currency,
    customerEmail: userEmail,
  });

  const payment: Payment = {
    id: newId(),
    orderId: order.id,
    stripePaymentIntentId: intent.id,
    amountMinor: totalMinor,
    currency: order.currency,
    status: intent.status,
    createdAt: ts,
    updatedAt: ts,
  };

  store.orders.set(order.id, order);
  store.payments.set(payment.id, payment);
  store.orderIdempotency.set(idemKey, order.id);
  clearCart(userId);
  notifyOrderStatus(userId, order.id, 'placed');
  emitOrderStatus(order);

  return {
    order,
    payment: { id: intent.id, clientSecret: intent.clientSecret, status: intent.status },
  };
}

export function getOrder(userId: string, orderId: string): Order {
  const order = getStore().orders.get(orderId);
  if (!order) throw NotFound('Order not found');
  if (order.userId !== userId) throw Forbidden('Not your order');
  return order;
}

export function getOrderPrivileged(orderId: string): Order {
  const order = getStore().orders.get(orderId);
  if (!order) throw NotFound('Order not found');
  return order;
}

export function listOrders(
  userId: string,
  page: number,
  pageSize: number,
): { data: Order[]; page: number; pageSize: number; total: number; totalPages: number } {
  const all = [...getStore().orders.values()]
    .filter((o) => o.userId === userId)
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  const start = (page - 1) * pageSize;
  return {
    data: all.slice(start, start + pageSize),
    page,
    pageSize,
    total: all.length,
    totalPages: Math.ceil(all.length / pageSize),
  };
}

/** Confirm payment succeeded (webhook or mock) and advance placed -> confirmed. */
export async function confirmPayment(paymentIntentId: string): Promise<Order> {
  const store = getStore();
  const payment = [...store.payments.values()].find(
    (p) => p.stripePaymentIntentId === paymentIntentId,
  );
  if (!payment) throw NotFound('Payment not found');

  const status = await getPaymentProvider().confirm(paymentIntentId);
  payment.status = status;
  payment.updatedAt = nowIso();

  const order = store.orders.get(payment.orderId);
  if (order && status === 'succeeded' && order.status === 'placed') {
    return applyTransition(order, 'confirmed');
  }
  if (!order) throw NotFound('Order not found');
  return order;
}

function applyTransition(order: Order, to: OrderStatus): Order {
  order.status = to;
  order.updatedAt = nowIso();
  getStore().orders.set(order.id, order);
  notifyOrderStatus(order.userId, order.id, to);
  emitOrderStatus(order);
  return order;
}

export function transitionOrder(
  actorRole: UserRole,
  actorId: string,
  orderId: string,
  to: OrderStatus,
): Order {
  const order = getOrderPrivileged(orderId);
  if (actorRole === 'customer' && order.userId !== actorId) {
    throw Forbidden('Not your order');
  }
  if (actorRole === 'driver' && order.driverId && order.driverId !== actorId) {
    throw Forbidden('Not your delivery');
  }
  assertRoleCanTransition(actorRole, order.status, to);
  return applyTransition(order, to);
}

export function assignDriver(orderId: string, driverId: string): Order {
  const order = getOrderPrivileged(orderId);
  if (order.driverId && order.driverId !== driverId) {
    throw Conflict('Order already assigned to another driver');
  }
  order.driverId = driverId;
  order.updatedAt = nowIso();
  getStore().orders.set(order.id, order);
  return order;
}

export function listAvailableDeliveries(): Order[] {
  return [...getStore().orders.values()].filter(
    (o) => o.status === 'preparing' && !o.driverId,
  );
}
