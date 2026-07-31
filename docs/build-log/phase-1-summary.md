# Phase 1 — Data model & API contract (handoff summary)

## Built

- **Shared Zod contract** in `packages/shared/src` — the single source of truth,
  imported by both client and server (never duplicated):
  - `common.ts` — ids, money (integer minor units), currency, email, **password
    policy**, phone, pagination helpers, `ApiError`.
  - `auth.ts` — register/login/refresh/logout inputs, `AuthResponse`, JWT claims.
  - `domain/` — `user`, `address`, `restaurant`, `menu` (+ search query),
    `cart`, `order` (+ **state machine** `ORDER_TRANSITIONS` / `canTransition`),
    `payment`, `review`, `notification`.
- **MySQL schema** (`apps/api/prisma/schema.prisma`) covering users, addresses,
  restaurants, menu_items, carts, cart_items, orders, order_items, payments,
  reviews, sessions, notifications, push_tokens, favorites. Full-text indexes on
  restaurant/menu name+description. `prisma generate` succeeds.

## Key decisions

- Money is stored/transmitted as **integer minor units** (cents) everywhere to
  avoid float drift; currency carried alongside.
- Order state machine encoded in shared code so client, server, vendor, and driver
  all agree on legal transitions.
- Refresh-token sessions modeled server-side (`Session`) storing only a hash.

## Status / left to verify

- OpenAPI mirror generation from the Zod schemas is not yet wired (planned via
  `zod-to-openapi`); the Zod contract itself is authoritative today.
- Prisma **migrations** require a running MySQL (`docker compose up -d`); the
  schema validates and the client generates offline.
