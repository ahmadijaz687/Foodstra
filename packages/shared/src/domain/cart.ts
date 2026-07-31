import { z } from 'zod';
import {
  CurrencySchema,
  IdSchema,
  IsoDateTimeSchema,
  MoneyMinorSchema,
} from '../common.js';

export const CartItemSchema = z.object({
  id: IdSchema,
  menuItemId: IdSchema,
  name: z.string().min(1).max(120),
  unitPriceMinor: MoneyMinorSchema,
  quantity: z.number().int().positive().max(99),
  notes: z.string().max(280).optional(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

export const CartSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  restaurantId: IdSchema.nullable(),
  currency: CurrencySchema,
  items: z.array(CartItemSchema),
  subtotalMinor: MoneyMinorSchema,
  updatedAt: IsoDateTimeSchema,
});
export type Cart = z.infer<typeof CartSchema>;

export const AddCartItemSchema = z.object({
  menuItemId: IdSchema,
  quantity: z.number().int().positive().max(99).default(1),
  notes: z.string().max(280).optional(),
});
export type AddCartItemInput = z.infer<typeof AddCartItemSchema>;

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().nonnegative().max(99),
  notes: z.string().max(280).optional(),
});
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
