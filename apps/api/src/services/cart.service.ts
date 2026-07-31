import {
  type AddCartItemInput,
  type Cart,
  type CartItem,
  type UpdateCartItemInput,
} from '@foodstra/shared';
import { BadRequest, NotFound } from '../lib/errors.js';
import { newId } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';
import { getStore } from '../store/index.js';
import { getMenuItem } from './menu.service.js';

export function computeSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPriceMinor * i.quantity, 0);
}

function emptyCart(userId: string): Cart {
  return {
    id: newId(),
    userId,
    restaurantId: null,
    currency: 'USD',
    items: [],
    subtotalMinor: 0,
    updatedAt: nowIso(),
  };
}

function persist(cart: Cart): Cart {
  const next: Cart = {
    ...cart,
    restaurantId: cart.items.length === 0 ? null : cart.restaurantId,
    subtotalMinor: computeSubtotal(cart.items),
    updatedAt: nowIso(),
  };
  getStore().carts.set(cart.userId, next);
  return next;
}

export function getCart(userId: string): Cart {
  return getStore().carts.get(userId) ?? emptyCart(userId);
}

export function addItem(userId: string, input: AddCartItemInput): Cart {
  const menuItem = getMenuItem(input.menuItemId);
  if (!menuItem.isAvailable) {
    throw BadRequest('That item is currently unavailable');
  }

  const cart = getCart(userId);
  // A cart holds items from a single restaurant at a time.
  if (cart.restaurantId && cart.restaurantId !== menuItem.restaurantId) {
    throw BadRequest(
      'Your cart contains items from another restaurant. Clear it first.',
    );
  }
  cart.restaurantId = menuItem.restaurantId;
  cart.currency = menuItem.currency;

  const existing = cart.items.find((i) => i.menuItemId === menuItem.id);
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + input.quantity);
    if (input.notes !== undefined) existing.notes = input.notes;
  } else {
    const item: CartItem = {
      id: newId(),
      menuItemId: menuItem.id,
      name: menuItem.name,
      unitPriceMinor: menuItem.priceMinor,
      quantity: input.quantity,
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    };
    cart.items.push(item);
  }
  return persist(cart);
}

export function updateItem(
  userId: string,
  cartItemId: string,
  input: UpdateCartItemInput,
): Cart {
  const cart = getCart(userId);
  const item = cart.items.find((i) => i.id === cartItemId);
  if (!item) throw NotFound('Cart item not found');

  if (input.quantity === 0) {
    cart.items = cart.items.filter((i) => i.id !== cartItemId);
  } else {
    item.quantity = input.quantity;
    if (input.notes !== undefined) item.notes = input.notes;
  }
  return persist(cart);
}

export function removeItem(userId: string, cartItemId: string): Cart {
  const cart = getCart(userId);
  const before = cart.items.length;
  cart.items = cart.items.filter((i) => i.id !== cartItemId);
  if (cart.items.length === before) throw NotFound('Cart item not found');
  return persist(cart);
}

export function clearCart(userId: string): Cart {
  return persist(emptyCart(userId));
}
