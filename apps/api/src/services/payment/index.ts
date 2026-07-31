import { getEnv } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { MockProvider } from './mock.js';
import { StripeProvider } from './stripe.js';
import type { PaymentProvider } from './provider.js';

let provider: PaymentProvider | null = null;

/**
 * Chooses the payment backend once: real Stripe when STRIPE_SECRET_KEY is set,
 * otherwise the in-memory mock (dev/test). No caller code changes when keys
 * are added later.
 */
export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;
  const env = getEnv();
  if (env.STRIPE_SECRET_KEY) {
    provider = new StripeProvider(env.STRIPE_SECRET_KEY);
    logger.info('Payments: using Stripe provider');
  } else {
    provider = new MockProvider();
    logger.warn('Payments: STRIPE_SECRET_KEY not set — using mock provider');
  }
  return provider;
}

/** Test helper. */
export function resetPaymentProvider(): void {
  provider = null;
}

export type { PaymentProvider } from './provider.js';
