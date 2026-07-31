import { z } from 'zod';
import { IdSchema, IsoDateTimeSchema } from '../common.js';

export const RestaurantSchema = z.object({
  id: IdSchema,
  ownerId: IdSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  cuisines: z.array(z.string().min(1).max(40)).max(20),
  addressLine: z.string().min(1).max(240),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isOpen: z.boolean(),
  ratingAvg: z.number().min(0).max(5),
  ratingCount: z.number().int().nonnegative(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type Restaurant = z.infer<typeof RestaurantSchema>;

export const CreateRestaurantSchema = RestaurantSchema.omit({
  id: true,
  ownerId: true,
  ratingAvg: true,
  ratingCount: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateRestaurantInput = z.infer<typeof CreateRestaurantSchema>;

export const UpdateRestaurantSchema = CreateRestaurantSchema.partial();
export type UpdateRestaurantInput = z.infer<typeof UpdateRestaurantSchema>;
