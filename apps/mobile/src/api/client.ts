import Constants from 'expo-constants';
import {
  ApiErrorSchema,
  AuthResponseSchema,
  LoginSchema,
  RegisterSchema,
  type AuthResponse,
  type AuthTokens,
  type LoginInput,
  type RegisterInput,
} from '@foodstra/shared';
import type { ZodTypeAny, infer as ZodInfer } from 'zod';
import { clearTokens, loadTokens, saveTokens } from '../auth/storage';

const baseUrl =
  (Constants.expoConfig?.extra?.['apiUrl'] as string | undefined) ??
  'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function parseResponse<S extends ZodTypeAny>(
  res: Response,
  schema: S,
): Promise<ZodInfer<S>> {
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = ApiErrorSchema.safeParse(json);
    if (err.success) {
      throw new ApiError(res.status, err.data.error.code, err.data.error.message);
    }
    throw new ApiError(res.status, 'unknown', `Request failed (${res.status})`);
  }
  return schema.parse(json);
}

async function request<S extends ZodTypeAny>(
  path: string,
  init: RequestInit,
  schema: S,
): Promise<ZodInfer<S>> {
  const tokens = await loadTokens();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (tokens?.accessToken) {
    headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }
  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
  return parseResponse(res, schema);
}

/** Client validates with the SAME shared Zod schema before hitting the API. */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const body = RegisterSchema.parse(input);
  const auth = await request(
    '/api/v1/auth/register',
    { method: 'POST', body: JSON.stringify(body) },
    AuthResponseSchema,
  );
  await saveTokens(auth.tokens);
  return auth;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const body = LoginSchema.parse(input);
  const auth = await request(
    '/api/v1/auth/login',
    { method: 'POST', body: JSON.stringify(body) },
    AuthResponseSchema,
  );
  await saveTokens(auth.tokens);
  return auth;
}

export async function logout(): Promise<void> {
  const tokens: AuthTokens | null = await loadTokens();
  if (tokens) {
    await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    }).catch(() => undefined);
  }
  await clearTokens();
}
