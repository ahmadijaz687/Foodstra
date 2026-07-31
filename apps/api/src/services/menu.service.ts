import {
  paginatedSchema,
  RestaurantSchema,
  MenuItemSchema,
  type CreateMenuItemInput,
  type MenuItem,
  type MenuSearchQuery,
  type Restaurant,
  type UpdateMenuItemInput,
} from '@foodstra/shared';
import { z } from 'zod';
import { NotFound } from '../lib/errors.js';
import { newId } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';
import { getStore } from '../store/index.js';

export const PaginatedMenuSchema = paginatedSchema(MenuItemSchema);
export const RestaurantListSchema = z.array(RestaurantSchema);
export type PaginatedMenu = z.infer<typeof PaginatedMenuSchema>;

export function listRestaurants(): Restaurant[] {
  return [...getStore().restaurants.values()];
}

export function getRestaurant(id: string): Restaurant {
  const r = getStore().restaurants.get(id);
  if (!r) throw NotFound('Restaurant not found');
  return r;
}

/** Full-text-ish menu search with category + price + restaurant filters. */
export function searchMenu(query: MenuSearchQuery): PaginatedMenu {
  const store = getStore();
  const q = query.q?.trim().toLowerCase();
  let items = [...store.menuItems.values()];

  if (query.restaurantId) {
    items = items.filter((i) => i.restaurantId === query.restaurantId);
  }
  if (query.category) {
    const c = query.category.toLowerCase();
    items = items.filter((i) => i.category.toLowerCase() === c);
  }
  if (query.availableOnly) {
    items = items.filter((i) => i.isAvailable);
  }
  if (typeof query.maxPriceMinor === 'number') {
    items = items.filter((i) => i.priceMinor <= query.maxPriceMinor!);
  }
  if (q) {
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.description?.toLowerCase().includes(q) ?? false) ||
        i.category.toLowerCase().includes(q),
    );
  }

  items.sort((a, b) => a.name.localeCompare(b.name));

  const total = items.length;
  const start = (query.page - 1) * query.pageSize;
  const data = items.slice(start, start + query.pageSize);
  return {
    data,
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export function getMenuItem(id: string): MenuItem {
  const item = getStore().menuItems.get(id);
  if (!item) throw NotFound('Menu item not found');
  return item;
}

export function createMenuItem(
  restaurantId: string,
  input: CreateMenuItemInput,
): MenuItem {
  const store = getStore();
  getRestaurant(restaurantId); // throws if missing
  const ts = nowIso();
  const item: MenuItem = {
    id: newId(),
    restaurantId,
    name: input.name,
    category: input.category,
    priceMinor: input.priceMinor,
    currency: input.currency,
    isAvailable: input.isAvailable,
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
    createdAt: ts,
    updatedAt: ts,
  };
  store.menuItems.set(item.id, item);
  return item;
}

export function updateMenuItem(
  id: string,
  input: UpdateMenuItemInput,
): MenuItem {
  const item = getMenuItem(id);
  const updated: MenuItem = {
    ...item,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.priceMinor !== undefined ? { priceMinor: input.priceMinor } : {}),
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
    updatedAt: nowIso(),
  };
  getStore().menuItems.set(id, updated);
  return updated;
}

export function deleteMenuItem(id: string): void {
  const store = getStore();
  if (!store.menuItems.delete(id)) throw NotFound('Menu item not found');
}
