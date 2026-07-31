import { z } from 'zod';
import { EmailSchema, IdSchema, IsoDateTimeSchema, PhoneSchema } from '../common.js';

export const UserRoleSchema = z.enum(['customer', 'vendor', 'driver', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

/** Public-safe user representation. Never includes password hashes or tokens. */
export const UserSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  displayName: z.string().min(1).max(80),
  phone: PhoneSchema.optional(),
  role: UserRoleSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type User = z.infer<typeof UserSchema>;

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  phone: PhoneSchema.optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
