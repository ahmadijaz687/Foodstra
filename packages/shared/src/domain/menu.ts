import { z } from 'zod';
import {
  CurrencySchema,
  IdSchema,
  IsoDateTimeSchema,
  MoneyMinorSchema,
  PaginationQuerySchema,
} from '../common.js';

export const MenuItemSchema = z.object({
  id: IdSchema,
  restaurantId: IdSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().min(1).max(60),
  priceMinor: MoneyMinorSchema,
  currency: CurrencySchema,
  /** 86'd / temporarily unavailable when false. */
  isAvailable: z.boolean(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

export const CreateMenuItemSchema = MenuItemSchema.omit({
  id: true,
  restaurantId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  isAvailable: z.boolean().default(true),
});
export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>;

export const UpdateMenuItemSchema = CreateMenuItemSchema.partial();
export type UpdateMenuItemInput = z.infer<typeof UpdateMenuItemSchema>;

export const MenuSearchQuerySchema = PaginationQuerySchema.extend({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(60).optional(),
  restaurantId: IdSchema.optional(),
  maxPriceMinor: z.coerce.number().int().nonnegative().optional(),
  availableOnly: z.coerce.boolean().default(true),
});
export type MenuSearchQuery = z.infer<typeof MenuSearchQuerySchema>;
