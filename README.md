# FoodStra

Consumer food‑delivery platform — customer app, vendor dashboard, and driver app
sharing one backend and one contract. Built as a pnpm workspace monorepo.

> Branding is final from the first commit: the product is **FoodStra** everywhere,
> with a black theme and a bold **FS** monogram.

## Monorepo layout

```
apps/
  mobile/     Expo (React Native) customer app — TypeScript strict
  api/        Node.js + Express backend — TypeScript
packages/
  shared/     Zod schemas = the single source of truth for the API contract.
              Imported by BOTH client and server; never duplicated.
```

## Tech stack

| Concern      | Choice                                                        |
| ------------ | ------------------------------------------------------------- |
| Mobile       | React Native + Expo SDK 51, TypeScript strict                 |
| Backend      | Node.js + Express, TypeScript                                 |
| Contract     | Zod schemas in `packages/shared` (mirrored to OpenAPI)        |
| Database     | MySQL (Prisma) primary store; Redis for cache/session/limits  |
| Auth         | JWT access + rotating **hashed** refresh tokens, argon2id     |
| Payments     | Stripe — server‑side PaymentIntents, hosted payment sheet     |
| Realtime     | Socket.IO — per‑order channel for status + driver location    |
| Observability| Sentry (client + server)                                      |

## Prerequisites

- Node.js >= 20.11
- pnpm 9 (`corepack` recommended)
- Docker (for local MySQL + Redis) — see `docker-compose.yml`

## Getting started

```bash
pnpm install
pnpm --filter @foodstra/api prisma:generate

# Local infra (MySQL + Redis)
docker compose up -d

# Env
cp .env.example apps/api/.env   # then fill in secrets

# Quality gate (also run by the pre-commit hook and CI)
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

### Run the backend

```bash
pnpm --filter @foodstra/api dev      # http://localhost:4000/health
```

### Run the mobile app

```bash
pnpm --filter @foodstra/mobile start
```

## Environment variables

All configuration is read from the environment and validated at boot
(`apps/api/src/config/env.ts`). See `.env.example` for the full list. Highlights:

| Variable                      | Purpose                                        |
| ----------------------------- | ---------------------------------------------- |
| `DATABASE_URL`                | MySQL connection string                        |
| `REDIS_URL`                   | Redis connection string                        |
| `JWT_ACCESS_SECRET` / `..._REFRESH_SECRET` | Token signing secrets             |
| `STRIPE_SECRET_KEY` / `..._WEBHOOK_SECRET` | Stripe (test/live)                |
| `SENTRY_DSN`                  | Sentry error reporting                         |

**Secrets are never committed.** For EAS/Expo, authentication is supplied only
via the environment:

```bash
export EXPO_TOKEN=<injected from your secrets manager / shell — never in a repo file>
```

`eas build` / `eas submit` read `EXPO_TOKEN` automatically. In CI it is a named
secret referenced via interpolation — its literal value is never inlined or logged.

## Build phases

Development follows the phased plan tracked in `docs/build-log/`. Each phase ends
in a runnable build and a `phase-N-summary.md` handoff.

## Security posture

- No plaintext secrets, API keys, or credentials in code or git history.
- Passwords hashed with argon2id; refresh tokens stored only as SHA‑256 hashes.
- No card data or PII stored client‑side unencrypted; tokens live in the device
  secure enclave via `expo-secure-store`.
- Contract‑first: one set of Zod schemas, imported by client and server.
