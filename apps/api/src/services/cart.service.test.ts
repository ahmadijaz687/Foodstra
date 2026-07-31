import { beforeEach, describe, expect, it } from 'vitest';
import { computeSubtotal, addItem, getCart, clearCart } from './cart.service.js';
import { searchMenu } from './menu.service.js';
import { resetStore, getStore } from '../store/index.js';
import { seedStore } from '../store/seed.js';

describe('cart math', () => {
  it('sums unit price * quantity', () => {
    expect(
      computeSubtotal([
        { id: 'a', menuItemId: 'm1', name: 'x', unitPriceMinor: 1400, quantity: 2 },
        { id: 'b', menuItemId: 'm2', name: 'y', unitPriceMinor: 800, quantity: 1 },
      ]),
    ).toBe(3600);
  });

  it('empty cart subtotal is 0', () => {
    expect(computeSubtotal([])).toBe(0);
  });
});

describe('menu search', () => {
  beforeEach(() => {
    resetStore();
    seedStore();
  });

  it('finds items by name query', () => {
    const res = searchMenu({ q: 'pizza', page: 1, pageSize: 20, availableOnly: true });
    expect(res.total).toBeGreaterThan(0);
    expect(res.data.every((i) => /pizza/i.test(i.name) || /pizza/i.test(i.category))).toBe(true);
  });

  it('filters by category and paginates', () => {
    const res = searchMenu({ category: 'Sushi', page: 1, pageSize: 1, availableOnly: true });
    expect(res.pageSize).toBe(1);
    expect(res.data).toHaveLength(1);
    expect(res.totalPages).toBe(res.total);
  });

  it('respects maxPriceMinor', () => {
    const res = searchMenu({ maxPriceMinor: 500, page: 1, pageSize: 50, availableOnly: true });
    expect(res.data.every((i) => i.priceMinor <= 500)).toBe(true);
  });
});

describe('cart service', () => {
  beforeEach(() => {
    resetStore();
    seedStore();
  });

  it('adds items and rejects cross-restaurant mixing', () => {
    const items = [...getStore().menuItems.values()];
    const first = items[0]!;
    const otherRestaurant = items.find((i) => i.restaurantId !== first.restaurantId)!;

    let cart = addItem('user-1', { menuItemId: first.id, quantity: 2 });
    expect(cart.items).toHaveLength(1);
    expect(cart.subtotalMinor).toBe(first.priceMinor * 2);

    expect(() =>
      addItem('user-1', { menuItemId: otherRestaurant.id, quantity: 1 }),
    ).toThrow(/another restaurant/i);

    cart = clearCart('user-1');
    expect(cart.items).toHaveLength(0);
    expect(cart.restaurantId).toBeNull();
    expect(getCart('user-1').subtotalMinor).toBe(0);
  });

  it('merges quantity when adding the same item twice', () => {
    const item = [...getStore().menuItems.values()][0]!;
    addItem('user-2', { menuItemId: item.id, quantity: 1 });
    const cart = addItem('user-2', { menuItemId: item.id, quantity: 3 });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]!.quantity).toBe(4);
  });
});
