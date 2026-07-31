import { Router } from 'express';
import {
  AddCartItemSchema,
  UpdateCartItemSchema,
  type AddCartItemInput,
  type UpdateCartItemInput,
} from '@foodstra/shared';
import { getParam } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { parsed, validate } from '../middleware/validate.js';
import * as cart from '../services/cart.service.js';

export const cartRouter = Router();

cartRouter.use(requireAuth);

cartRouter.get('/', (req, res) => {
  res.json(cart.getCart(req.auth!.userId));
});

cartRouter.post('/items', validate(AddCartItemSchema), (req, res, next) => {
  try {
    const input = parsed<AddCartItemInput>(res, 'body');
    res.status(201).json(cart.addItem(req.auth!.userId, input));
  } catch (err) {
    next(err);
  }
});

cartRouter.patch(
  '/items/:itemId',
  validate(UpdateCartItemSchema),
  (req, res, next) => {
    try {
      const input = parsed<UpdateCartItemInput>(res, 'body');
      res.json(cart.updateItem(req.auth!.userId, getParam(req, 'itemId'), input));
    } catch (err) {
      next(err);
    }
  },
);

cartRouter.delete('/items/:itemId', (req, res, next) => {
  try {
    res.json(cart.removeItem(req.auth!.userId, getParam(req, 'itemId')));
  } catch (err) {
    next(err);
  }
});

cartRouter.delete('/', (req, res) => {
  res.json(cart.clearCart(req.auth!.userId));
});
