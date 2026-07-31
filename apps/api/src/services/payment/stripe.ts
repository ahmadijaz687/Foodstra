import Stripe from 'stripe';
import type { PaymentStatus } from '@foodstra/shared';
import type {
  CreateIntentArgs,
  PaymentIntentResult,
  PaymentProvider,
} from './provider.js';

function mapStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
  switch (status) {
    case 'succeeded':
      return 'succeeded';
    case 'processing':
      return 'processing';
    case 'canceled':
      return 'failed';
    default:
      return 'requires_payment';
  }
}

/**
 * Real Stripe integration. PaymentIntents are created server-side; the client
 * completes payment via Stripe's hosted Payment Sheet, so raw card data never
 * reaches our servers. Used when STRIPE_SECRET_KEY is configured.
 */
export class StripeProvider implements PaymentProvider {
  readonly name = 'stripe';
  private readonly stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
  }

  async createPaymentIntent(
    args: CreateIntentArgs,
  ): Promise<PaymentIntentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: args.amountMinor,
      currency: args.currency.toLowerCase(),
      metadata: { orderId: args.orderId },
      receipt_email: args.customerEmail,
      automatic_payment_methods: { enabled: true },
    });
    return {
      id: intent.id,
      clientSecret: intent.client_secret ?? '',
      status: mapStatus(intent.status),
    };
  }

  async confirm(paymentIntentId: string): Promise<PaymentStatus> {
    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return mapStatus(intent.status);
  }

  async refund(paymentIntentId: string): Promise<PaymentStatus> {
    await this.stripe.refunds.create({ payment_intent: paymentIntentId });
    return 'refunded';
  }
}
