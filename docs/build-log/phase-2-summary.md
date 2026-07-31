# Phase 2 — Auth & user management (handoff summary)

## Built (backend)

- `POST /api/v1/auth/register` — argon2id password hashing, duplicate-email guard.
- `POST /api/v1/auth/login` — rate-limited (10 / 15 min), constant-time-ish verify
  to avoid user enumeration.
- `POST /api/v1/auth/refresh` — **rotating** refresh tokens: the used session is
  revoked and a new one minted; reuse of an old token is rejected (401).
- `POST /api/v1/auth/logout` — idempotent session revocation.
- `GET /api/v1/auth/me` — bearer-protected profile.
- JWT access tokens (`src/lib/tokens.ts`); refresh tokens are opaque
  `sessionId.secret` strings whose secret is stored only as a SHA-256 hash.
- Middleware: `requireAuth`, `requireRole` (server-side RBAC),
  Zod `validate`, central `errorHandler`.

## Built (client)

- `apps/mobile/src/auth/storage.ts` — tokens stored ONLY in the device secure
  enclave via `expo-secure-store` (never AsyncStorage/plain files).
- `apps/mobile/src/api/client.ts` — fetch wrapper that validates requests with the
  **same shared Zod schemas** and parses responses against them; attaches the
  bearer token; persists tokens on register/login and clears on logout.

## Acceptance

- Backend flow register → login → me → refresh (rotation) → reuse-rejected →
  logout is covered by Supertest (`auth.routes.test.ts`, 6 tests, passing).

## Status / left to verify (next session)

- Client **auth state machine** + auto-refresh interceptor (on 401, refresh once
  then retry) and optional biometric unlock are not yet implemented.
- "Session survives app restart" needs the client bootstrap that calls
  `loadTokens()` on launch — to be added with navigation in Phase 3.
