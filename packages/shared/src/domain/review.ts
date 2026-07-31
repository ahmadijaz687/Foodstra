import { z } from 'zod';
import { IdSchema, IsoDateTimeSchema } from '../common.js';

export const ReviewSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  restaurantId: IdSchema,
  orderId: IdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type Review = z.infer<typeof ReviewSchema>;

/** Reviews are only allowed against a delivered order (enforced server-side). */
export const CreateReviewSchema = z.object({
  orderId: IdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
