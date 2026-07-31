import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import {
  AccessTokenClaimsSchema,
  type AccessTokenClaims,
  type UserRole,
} from '@foodstra/shared';
import { getEnv } from '../config/env.js';
import { Unauthorized } from './errors.js';

export function signAccessToken(userId: string, role: UserRole): {
  token: string;
  expiresAt: Date;
} {
  const env = getEnv();
  const expiresAt = new Date(Date.now() + env.ACCESS_TOKEN_TTL_SECONDS * 1000);
  const payload: AccessTokenClaims = { sub: userId, role, type: 'access' };
  const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
  });
  return { token, expiresAt };
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const env = getEnv();
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    return AccessTokenClaimsSchema.parse(decoded);
  } catch {
    throw Unauthorized('Invalid or expired access token');
  }
}

/** Refresh tokens are opaque; only their SHA-256 hash is persisted. */
export function hashRefreshSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

/** Encodes `sessionId.secret`; the server stores only hash(secret). */
export function encodeRefreshToken(sessionId: string, secret: string): string {
  return `${sessionId}.${secret}`;
}

export function decodeRefreshToken(
  token: string,
): { sessionId: string; secret: string } {
  const idx = token.indexOf('.');
  if (idx <= 0 || idx === token.length - 1) {
    throw Unauthorized('Malformed refresh token');
  }
  return {
    sessionId: token.slice(0, idx),
    secret: token.slice(idx + 1),
  };
}
