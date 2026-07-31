import { Router } from 'express';
import {
  CreateOrderSchema,
  PaginationQuerySchema,
  UpdateOrderStatusSchema,
  type CreateOrderInput,
  type PaginationQuery,
  type UpdateOrderStatusInput,
} from '@foodstra/shared';
import { NotFound } from '../lib/errors.js';
import { getParam } from '../lib/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { parsed, validate } from '../middleware/validate.js';
import { getStore } from '../store/index.js';
import * as orders from '../services/order.service.js';

export const orderRouter = Router();

orderRouter.use(requireAuth);

orderRouter.post(
  '/',
  requireRole('customer'),
  validate(CreateOrderSchema),
  (req, res, next) => {
    (async () => {
      const input = parsed<CreateOrderInput>(res, 'body');
      const user = getStore().users.get(req.auth!.userId);
      if (!user) throw NotFound('User not found');
      const result = await orders.createOrder(
        req.auth!.userId,
        user.email,
        input.addressId,
        input.idempotencyKey,
      );
      res.status(201).json(result);
    })().catch(next);
  },
);

// Driver: list unclaimed deliveries (must precede /:id)
orderRouter.get('/available', requireRole('driver', 'admin'), (_req, res) => {
  res.json(orders.listAvailableDeliveries());
});

orderRouter.get('/', validate(PaginationQuerySchema, 'query'), (req, res) => {
  const q = parsed<PaginationQuery>(res, 'query');
  res.json(orders.listOrders(req.auth!.userId, q.page, q.pageSize));
});

orderRouter.get('/:id', (req, res, next) => {
  try {
    const { userId, role } = req.auth!;
    const id = getParam(req, 'id');
    const order =
      role === 'customer'
        ? orders.getOrder(userId, id)
        : orders.getOrderPrivileged(id);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

orderRouter.post(
  '/:id/status',
  validate(UpdateOrderStatusSchema),
  (req, res, next) => {
    try {
      const input = parsed<UpdateOrderStatusInput>(res, 'body');
      const { userId, role } = req.auth!;
      res.json(orders.transitionOrder(role, userId, getParam(req, 'id'), input.status));
    } catch (err) {
      next(err);
    }
  },
);

orderRouter.post('/:id/claim', requireRole('driver'), (req, res, next) => {
  try {
    res.json(orders.assignDriver(getParam(req, 'id'), req.auth!.userId));
  } catch (err) {
    next(err);
  }
});

// Dev/mock: confirm the order's payment (real Stripe uses the webhook route).
orderRouter.post('/:id/confirm-payment', (req, res, next) => {
  (async () => {
    const { userId, role } = req.auth!;
    const id = getParam(req, 'id');
    if (role === 'customer') orders.getOrder(userId, id);
    const payment = [...getStore().payments.values()].find(
      (p) => p.orderId === id,
    );
    if (!payment) throw NotFound('Payment not found');
    const order = await orders.confirmPayment(payment.stripePaymentIntentId);
    res.json(order);
  })().catch(next);
});
