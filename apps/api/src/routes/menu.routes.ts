import { Router } from 'express';
import {
  CreateMenuItemSchema,
  MenuSearchQuerySchema,
  UpdateMenuItemSchema,
  type CreateMenuItemInput,
  type MenuSearchQuery,
  type UpdateMenuItemInput,
} from '@foodstra/shared';
import { getParam } from '../lib/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { parsed, validate } from '../middleware/validate.js';
import * as menu from '../services/menu.service.js';

export const menuRouter = Router();

menuRouter.get('/restaurants', (_req, res) => {
  res.json(menu.listRestaurants());
});

menuRouter.get('/restaurants/:id', (req, res, next) => {
  try {
    res.json(menu.getRestaurant(getParam(req, 'id')));
  } catch (err) {
    next(err);
  }
});

menuRouter.get(
  '/search',
  validate(MenuSearchQuerySchema, 'query'),
  (_req, res) => {
    const query = parsed<MenuSearchQuery>(res, 'query');
    res.json(menu.searchMenu(query));
  },
);

menuRouter.get('/items/:id', (req, res, next) => {
  try {
    res.json(menu.getMenuItem(getParam(req, 'id')));
  } catch (err) {
    next(err);
  }
});

// --- Admin/vendor-gated writes ---
menuRouter.post(
  '/restaurants/:id/items',
  requireAuth,
  requireRole('vendor', 'admin'),
  validate(CreateMenuItemSchema),
  (req, res, next) => {
    try {
      const input = parsed<CreateMenuItemInput>(res, 'body');
      res.status(201).json(menu.createMenuItem(getParam(req, 'id'), input));
    } catch (err) {
      next(err);
    }
  },
);

menuRouter.patch(
  '/items/:id',
  requireAuth,
  requireRole('vendor', 'admin'),
  validate(UpdateMenuItemSchema),
  (req, res, next) => {
    try {
      const input = parsed<UpdateMenuItemInput>(res, 'body');
      res.json(menu.updateMenuItem(getParam(req, 'id'), input));
    } catch (err) {
      next(err);
    }
  },
);

menuRouter.delete(
  '/items/:id',
  requireAuth,
  requireRole('vendor', 'admin'),
  (req, res, next) => {
    try {
      menu.deleteMenuItem(getParam(req, 'id'));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
