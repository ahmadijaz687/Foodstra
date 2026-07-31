import type { Currency, PaymentStatus } from '@foodstra/shared';

export interface CreateIntentArgs {
  orderId: string;
  amountMinor: number;
  currency: Currency;
  customerEmail: string;
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
  status: PaymentStatus;
}

/**
 * Abstraction over the payment backend. `StripeProvider` is used when
 * STRIPE_SECRET_KEY is configured; `MockProvider` simulates the flow for
 * local dev and tests. Swapping providers requires no changes to callers —
 * raw card data never touches this layer either way.
 */
export interface PaymentProvider {
  readonly name: string;
  createPaymentIntent(args: CreateIntentArgs): Promise<PaymentIntentResult>;
  /** Simulates/handles capture confirmation; returns the resulting status. */
  confirm(paymentIntentId: string): Promise<PaymentStatus>;
  refund(paymentIntentId: string): Promise<PaymentStatus>;
}
