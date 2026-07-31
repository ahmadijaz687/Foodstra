import { z } from 'zod';
import { EmailSchema, PasswordSchema, PhoneSchema } from './common.js';
import { UserSchema } from './domain/user.js';

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  displayName: z.string().min(1).max(80),
  phone: PhoneSchema.optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof RefreshSchema>;

export const LogoutSchema = z.object({
  refreshToken: z.string().min(1),
});
export type LogoutInput = z.infer<typeof LogoutSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  accessTokenExpiresAt: z.string().datetime({ offset: true }),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  tokens: AuthTokensSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/** Decoded JWT access-token claims. */
export const AccessTokenClaimsSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(['customer', 'vendor', 'driver', 'admin']),
  type: z.literal('access'),
});
export type AccessTokenClaims = z.infer<typeof AccessTokenClaimsSchema>;
