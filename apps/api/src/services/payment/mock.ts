import { randomToken } from '../../lib/ids.js';
import type {
  CreateIntentArgs,
  PaymentIntentResult,
  PaymentProvider,
} from './provider.js';
import type { PaymentStatus } from '@foodstra/shared';

/**
 * Deterministic in-memory payment simulator. Mirrors Stripe's PaymentIntent
 * lifecycle (requires_payment -> succeeded) without any network or card data.
 */
export class MockProvider implements PaymentProvider {
  readonly name = 'mock';
  private readonly intents = new Map<string, PaymentStatus>();

  async createPaymentIntent(
    args: CreateIntentArgs,
  ): Promise<PaymentIntentResult> {
    const id = `pi_mock_${args.orderId.slice(0, 8)}_${randomToken(8)}`;
    this.intents.set(id, 'requires_payment');
    return {
      id,
      clientSecret: `${id}_secret_${randomToken(8)}`,
      status: 'requires_payment',
    };
  }

  async confirm(paymentIntentId: string): Promise<PaymentStatus> {
    this.intents.set(paymentIntentId, 'succeeded');
    return 'succeeded';
  }

  async refund(paymentIntentId: string): Promise<PaymentStatus> {
    this.intents.set(paymentIntentId, 'refunded');
    return 'refunded';
  }
}
