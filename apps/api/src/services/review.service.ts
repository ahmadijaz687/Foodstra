import type { CreateReviewInput, Review } from '@foodstra/shared';
import { BadRequest, Conflict, Forbidden, NotFound } from '../lib/errors.js';
import { newId } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';
import { getStore } from '../store/index.js';

export function listRestaurantReviews(restaurantId: string): Review[] {
  return [...getStore().reviews.values()]
    .filter((r) => r.restaurantId === restaurantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Reviews require a delivered order owned by the user; one per order. */
export function createReview(userId: string, input: CreateReviewInput): Review {
  const store = getStore();
  const order = store.orders.get(input.orderId);
  if (!order) throw NotFound('Order not found');
  if (order.userId !== userId) throw Forbidden('Not your order');
  if (order.status !== 'delivered') {
    throw BadRequest('You can only review a delivered order');
  }
  const already = [...store.reviews.values()].some(
    (r) => r.orderId === input.orderId,
  );
  if (already) throw Conflict('You already reviewed this order');

  const ts = nowIso();
  const review: Review = {
    id: newId(),
    userId,
    restaurantId: order.restaurantId,
    orderId: input.orderId,
    rating: input.rating,
    ...(input.comment !== undefined ? { comment: input.comment } : {}),
    createdAt: ts,
    updatedAt: ts,
  };
  store.reviews.set(review.id, review);
  recomputeRating(order.restaurantId);
  return review;
}

function recomputeRating(restaurantId: string): void {
  const store = getStore();
  const restaurant = store.restaurants.get(restaurantId);
  if (!restaurant) return;
  const reviews = [...store.reviews.values()].filter(
    (r) => r.restaurantId === restaurantId,
  );
  const count = reviews.length;
  const avg =
    count === 0
      ? 0
      : reviews.reduce((sum, r) => sum + r.rating, 0) / count;
  restaurant.ratingCount = count;
  restaurant.ratingAvg = Math.round(avg * 100) / 100;
  restaurant.updatedAt = nowIso();
}
