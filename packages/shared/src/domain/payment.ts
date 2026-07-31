import { z } from 'zod';
import {
  CurrencySchema,
  IdSchema,
  IsoDateTimeSchema,
  MoneyMinorSchema,
} from '../common.js';

export const PaymentStatusSchema = z.enum([
  'requires_payment',
  'processing',
  'succeeded',
  'failed',
  'refunded',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

/**
 * Server-side payment record. We NEVER store raw card data — only Stripe's
 * PaymentIntent id and status. Card entry happens in Stripe's hosted sheet.
 */
export const PaymentSchema = z.object({
  id: IdSchema,
  orderId: IdSchema,
  stripePaymentIntentId: z.string().min(1),
  amountMinor: MoneyMinorSchema,
  currency: CurrencySchema,
  status: PaymentStatusSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type Payment = z.infer<typeof PaymentSchema>;

/** Response used to initialize the Stripe Payment Sheet on the client. */
export const PaymentSheetParamsSchema = z.object({
  paymentIntentClientSecret: z.string().min(1),
  ephemeralKeySecret: z.string().min(1),
  customerId: z.string().min(1),
  publishableKey: z.string().min(1),
});
export type PaymentSheetParams = z.infer<typeof PaymentSheetParamsSchema>;
