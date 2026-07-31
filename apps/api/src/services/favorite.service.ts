import type { Restaurant } from '@foodstra/shared';
import { getStore } from '../store/index.js';
import { getRestaurant } from './menu.service.js';

export function listFavorites(userId: string): Restaurant[] {
  const ids = getStore().favorites.get(userId) ?? new Set<string>();
  return [...ids]
    .map((id) => getStore().restaurants.get(id))
    .filter((r): r is Restaurant => Boolean(r));
}

export function addFavorite(userId: string, restaurantId: string): void {
  getRestaurant(restaurantId); // throws if missing
  const store = getStore();
  const set = store.favorites.get(userId) ?? new Set<string>();
  set.add(restaurantId);
  store.favorites.set(userId, set);
}

export function removeFavorite(userId: string, restaurantId: string): void {
  getStore().favorites.get(userId)?.delete(restaurantId);
}
