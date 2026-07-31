import { z } from 'zod';
import {
  CurrencySchema,
  IdSchema,
  IsoDateTimeSchema,
  MoneyMinorSchema,
} from '../common.js';

export const OrderStatusSchema = z.enum([
  'placed',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/** Allowed forward transitions of the order state machine. */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export const OrderItemSchema = z.object({
  id: IdSchema,
  menuItemId: IdSchema,
  name: z.string().min(1).max(120),
  unitPriceMinor: MoneyMinorSchema,
  quantity: z.number().int().positive().max(99),
  notes: z.string().max(280).optional(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  restaurantId: IdSchema,
  driverId: IdSchema.nullable(),
  addressId: IdSchema,
  status: OrderStatusSchema,
  currency: CurrencySchema,
  items: z.array(OrderItemSchema).min(1),
  subtotalMinor: MoneyMinorSchema,
  deliveryFeeMinor: MoneyMinorSchema,
  taxMinor: MoneyMinorSchema,
  totalMinor: MoneyMinorSchema,
  placedAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderSchema = z.object({
  addressId: IdSchema,
  /** Idempotency key so retries never double-charge. */
  idempotencyKey: z.string().uuid(),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

/** Live driver-location update pushed over the per-order WebSocket. */
export const DriverLocationSchema = z.object({
  orderId: IdSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  at: IsoDateTimeSchema,
});
export type DriverLocation = z.infer<typeof DriverLocationSchema>;
