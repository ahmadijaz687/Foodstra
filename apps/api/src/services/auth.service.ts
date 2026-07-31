import argon2 from 'argon2';
import {
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
  type User,
} from '@foodstra/shared';
import { getEnv } from '../config/env.js';
import { Conflict, Unauthorized } from '../lib/errors.js';
import { newId, randomToken } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';
import {
  decodeRefreshToken,
  encodeRefreshToken,
  hashRefreshSecret,
  signAccessToken,
} from '../lib/tokens.js';
import { getStore } from '../store/index.js';
import type { SessionRecord, UserRecord } from '../store/types.js';

function toPublicUser(record: UserRecord): User {
  const { passwordHash: _passwordHash, ...user } = record;
  return user;
}

async function issueTokens(user: UserRecord): Promise<AuthResponse['tokens']> {
  const env = getEnv();
  const store = getStore();
  const secret = randomToken();
  const session: SessionRecord = {
    id: newId(),
    userId: user.id,
    refreshSecretHash: hashRefreshSecret(secret),
    role: user.role,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000),
    revokedAt: null,
    createdAt: new Date(),
  };
  store.sessions.set(session.id, session);

  const { token: accessToken, expiresAt } = signAccessToken(user.id, user.role);
  return {
    accessToken,
    refreshToken: encodeRefreshToken(session.id, secret),
    accessTokenExpiresAt: expiresAt.toISOString(),
  };
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const store = getStore();
  const existing = [...store.users.values()].find(
    (u) => u.email === input.email,
  );
  if (existing) {
    throw Conflict('An account with that email already exists');
  }

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });
  const ts = nowIso();
  const record: UserRecord = {
    id: newId(),
    email: input.email,
    displayName: input.displayName,
    ...(input.phone ? { phone: input.phone } : {}),
    role: 'customer',
    passwordHash,
    createdAt: ts,
    updatedAt: ts,
  };
  store.users.set(record.id, record);

  const tokens = await issueTokens(record);
  return { user: toPublicUser(record), tokens };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const store = getStore();
  const record = [...store.users.values()].find(
    (u) => u.email === input.email,
  );
  // Always run a hash comparison to avoid user-enumeration timing leaks.
  const hash =
    record?.passwordHash ??
    '$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const ok = await argon2.verify(hash, input.password).catch(() => false);
  if (!record || !ok) {
    throw Unauthorized('Invalid email or password');
  }

  const tokens = await issueTokens(record);
  return { user: toPublicUser(record), tokens };
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const store = getStore();
  const { sessionId, secret } = decodeRefreshToken(refreshToken);
  const session = store.sessions.get(sessionId);
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() < Date.now() ||
    session.refreshSecretHash !== hashRefreshSecret(secret)
  ) {
    throw Unauthorized('Invalid refresh token');
  }

  const user = store.users.get(session.userId);
  if (!user) throw Unauthorized('Invalid refresh token');

  // Rotate: revoke the used session and mint a fresh one.
  session.revokedAt = new Date();
  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), tokens };
}

export function logout(refreshToken: string): void {
  const store = getStore();
  try {
    const { sessionId } = decodeRefreshToken(refreshToken);
    const session = store.sessions.get(sessionId);
    if (session && !session.revokedAt) {
      session.revokedAt = new Date();
    }
  } catch {
    // Idempotent logout — a malformed/expired token is a no-op.
  }
}
