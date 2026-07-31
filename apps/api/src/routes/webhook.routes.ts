import { Router, type Request } from 'express';
import Stripe from 'stripe';
import { getEnv } from '../config/env.js';
import { BadRequest } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import * as orders from '../services/order.service.js';

export const webhookRouter = Router();

/**
 * Stripe webhook. Mounted with a raw body parser so the signature can be
 * verified. Only active when STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET are set;
 * in mock mode payments are confirmed via the order confirm-payment route.
 */
webhookRouter.post('/stripe', (req: Request, res, next) => {
  (async () => {
    const env = getEnv();
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
      throw BadRequest('Stripe webhooks are not configured');
    }
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string') throw BadRequest('Missing signature');

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw BadRequest('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await orders.confirmPayment(intent.id);
      logger.info({ intentId: intent.id }, 'stripe payment confirmed');
    }
    res.json({ received: true });
  })().catch(next);
});
