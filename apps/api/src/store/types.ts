import type {
  Address,
  Cart,
  MenuItem,
  Notification,
  Order,
  Payment,
  Restaurant,
  Review,
  User,
  UserRole,
} from '@foodstra/shared';

/** Server-only user record — includes the argon2 password hash. */
export interface UserRecord extends User {
  passwordHash: string;
}

/** Server-only session record — stores only the hash of the refresh secret. */
export interface SessionRecord {
  id: string;
  userId: string;
  refreshSecretHash: string;
  role: UserRole;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface PushTokenRecord {
  userId: string;
  token: string;
  platform: 'ios' | 'android';
}

export interface DataStore {
  users: Map<string, UserRecord>;
  sessions: Map<string, SessionRecord>;
  addresses: Map<string, Address>;
  restaurants: Map<string, Restaurant>;
  menuItems: Map<string, MenuItem>;
  carts: Map<string, Cart>; // keyed by userId
  orders: Map<string, Order>;
  payments: Map<string, Payment>;
  reviews: Map<string, Review>;
  notifications: Map<string, Notification>;
  pushTokens: Map<string, PushTokenRecord[]>; // keyed by userId
  favorites: Map<string, Set<string>>; // userId -> set of restaurantId
  orderIdempotency: Map<string, string>; // "userId:key" -> orderId
}

export function createEmptyStore(): DataStore {
  return {
    users: new Map(),
    sessions: new Map(),
    addresses: new Map(),
    restaurants: new Map(),
    menuItems: new Map(),
    carts: new Map(),
    orders: new Map(),
    payments: new Map(),
    reviews: new Map(),
    notifications: new Map(),
    pushTokens: new Map(),
    favorites: new Map(),
    orderIdempotency: new Map(),
  };
}
