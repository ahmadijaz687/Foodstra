import { z } from 'zod';
import { IdSchema, IsoDateTimeSchema } from '../common.js';
import { OrderStatusSchema } from './order.js';

export const NotificationTypeSchema = z.enum([
  'order_status',
  'promo',
  'system',
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  type: NotificationTypeSchema,
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  orderId: IdSchema.optional(),
  orderStatus: OrderStatusSchema.optional(),
  readAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
});
export type Notification = z.infer<typeof NotificationSchema>;

/** Register an Expo push token for the authenticated device. */
export const RegisterPushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android']),
});
export type RegisterPushTokenInput = z.infer<typeof RegisterPushTokenSchema>;
