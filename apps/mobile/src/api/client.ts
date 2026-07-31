import Constants from 'expo-constants';
import {
  ApiErrorSchema,
  AuthResponseSchema,
  AuthTokensSchema,
  AddressSchema,
  CartSchema,
  LoginSchema,
  MenuItemSchema,
  NotificationSchema,
  OrderSchema,
  RegisterSchema,
  RestaurantSchema,
  ReviewSchema,
  paginatedSchema,
  type AddCartItemInput,
  type Address,
  type AuthResponse,
  type AuthTokens,
  type Cart,
  type CreateAddressInput,
  type CreateOrderInput,
  type LoginInput,
  type MenuSearchQuery,
  type Notification,
  type Order,
  type OrderStatus,
  type RegisterInput,
  type Restaurant,
  type Review,
} from '@foodstra/shared';
import { z } from 'zod';
import type { ZodTypeAny, infer as ZodInfer } from 'zod';
import { clearTokens, loadTokens, saveTokens } from '../auth/storage';

export const baseUrl =
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

/** Callback invoked when refresh fails and the session must end. */
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(fn: () => void): void {
  onSessionExpired = fn;
}

async function parseResponse<S extends ZodTypeAny>(
  res: Response,
  schema: S,
): Promise<ZodInfer<S>> {
  if (res.status === 204) return undefined as ZodInfer<S>;
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

async function refreshTokens(): Promise<AuthTokens | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;
  const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });
  if (!res.ok) return null;
  const json: unknown = await res.json().catch(() => ({}));
  const parsed = AuthResponseSchema.safeParse(json);
  if (!parsed.success) return null;
  await saveTokens(parsed.data.tokens);
  return parsed.data.tokens;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  if (!query) return `${baseUrl}${path}`;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) qs.set(k, String(v));
  }
  const s = qs.toString();
  return `${baseUrl}${path}${s ? `?${s}` : ''}`;
}

/**
 * Core request with a single silent refresh-and-retry on 401. Access tokens are
 * attached from secure storage; a failed refresh clears the session.
 */
async function request<S extends ZodTypeAny>(
  path: string,
  schema: S,
  opts: RequestOptions = {},
  isRetry = false,
): Promise<ZodInfer<S>> {
  const headers = new Headers();
  if (opts.body !== undefined) headers.set('Content-Type', 'application/json');
  if (opts.auth !== false) {
    const tokens = await loadTokens();
    if (tokens?.accessToken) {
      headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    }
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? 'GET',
    headers,
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  });

  if (res.status === 401 && opts.auth !== false && !isRetry) {
    const refreshed = await refreshTokens();
    if (refreshed) return request(path, schema, opts, true);
    await clearTokens();
    onSessionExpired?.();
  }
  return parseResponse(res, schema);
}

// --- Auth ---
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const body = RegisterSchema.parse(input);
  const auth = await request('/api/v1/auth/register', AuthResponseSchema, {
    method: 'POST',
    body,
    auth: false,
  });
  await saveTokens(auth.tokens);
  return auth;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const body = LoginSchema.parse(input);
  const auth = await request('/api/v1/auth/login', AuthResponseSchema, {
    method: 'POST',
    body,
    auth: false,
  });
  await saveTokens(auth.tokens);
  return auth;
}

export async function logout(): Promise<void> {
  const tokens = await loadTokens();
  if (tokens) {
    await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    }).catch(() => undefined);
  }
  await clearTokens();
}

export async function refreshSession(): Promise<AuthTokens | null> {
  return refreshTokens();
}

// --- Menu ---
export async function fetchRestaurants(): Promise<Restaurant[]> {
  return request('/api/v1/menu/restaurants', z.array(RestaurantSchema), {
    auth: false,
  });
}

export async function fetchRestaurant(id: string): Promise<Restaurant> {
  return request(`/api/v1/menu/restaurants/${id}`, RestaurantSchema, {
    auth: false,
  });
}

const PaginatedMenu = paginatedSchema(MenuItemSchema);
export async function searchMenu(
  query: Partial<MenuSearchQuery>,
): Promise<z.infer<typeof PaginatedMenu>> {
  return request('/api/v1/menu/search', PaginatedMenu, {
    auth: false,
    query: query as Record<string, string | number | boolean | undefined>,
  });
}

// --- Cart ---
export async function fetchCart(): Promise<Cart> {
  return request('/api/v1/cart', CartSchema);
}

export async function addToCart(input: AddCartItemInput): Promise<Cart> {
  return request('/api/v1/cart/items', CartSchema, { method: 'POST', body: input });
}

export async function clearServerCart(): Promise<Cart> {
  return request('/api/v1/cart', CartSchema, { method: 'DELETE' });
}

// --- Addresses ---
export async function fetchAddresses(): Promise<Address[]> {
  return request('/api/v1/addresses', z.array(AddressSchema));
}

export async function createAddress(input: CreateAddressInput): Promise<Address> {
  return request('/api/v1/addresses', AddressSchema, { method: 'POST', body: input });
}

// --- Orders ---
const PaginatedOrders = paginatedSchema(OrderSchema);
export async function fetchOrders(): Promise<Order[]> {
  const res = await request('/api/v1/orders', PaginatedOrders);
  return res.data;
}

export async function fetchOrder(id: string): Promise<Order> {
  return request(`/api/v1/orders/${id}`, OrderSchema);
}

const PlacedOrderSchema = z.object({
  order: OrderSchema,
  payment: z.object({
    id: z.string(),
    clientSecret: z.string(),
    status: z.string(),
  }),
});
export async function placeOrder(
  input: CreateOrderInput,
): Promise<z.infer<typeof PlacedOrderSchema>> {
  return request('/api/v1/orders', PlacedOrderSchema, { method: 'POST', body: input });
}

export async function confirmOrderPayment(orderId: string): Promise<Order> {
  return request(`/api/v1/orders/${orderId}/confirm-payment`, OrderSchema, {
    method: 'POST',
  });
}

export async function setOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<Order> {
  return request(`/api/v1/orders/${orderId}/status`, OrderSchema, {
    method: 'POST',
    body: { status },
  });
}

// --- Favorites / Reviews / Notifications ---
export async function fetchFavorites(): Promise<Restaurant[]> {
  return request('/api/v1/favorites', z.array(RestaurantSchema));
}

export async function addFavorite(restaurantId: string): Promise<void> {
  await request(`/api/v1/favorites/${restaurantId}`, z.void(), { method: 'POST' });
}

export async function removeFavorite(restaurantId: string): Promise<void> {
  await request(`/api/v1/favorites/${restaurantId}`, z.void(), { method: 'DELETE' });
}

export async function fetchRestaurantReviews(
  restaurantId: string,
): Promise<Review[]> {
  return request(
    `/api/v1/reviews/restaurant/${restaurantId}`,
    z.array(ReviewSchema),
    { auth: false },
  );
}

export async function fetchNotifications(): Promise<Notification[]> {
  return request('/api/v1/notifications', z.array(NotificationSchema));
}

export { AuthTokensSchema };
