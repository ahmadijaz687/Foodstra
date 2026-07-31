# Phase 0 — Repo & tooling bootstrap (handoff summary)

## Built

- **pnpm workspace monorepo** (`pnpm-workspace.yaml`): `apps/mobile`, `apps/api`,
  `packages/shared`. Package manager pinned to `pnpm@9.15.0`.
- **`.npmrc`** with `node-linker=hoisted` (+ `shamefully-hoist`) from the first
  commit, to pre-empt the pnpm + React Native Gradle
  `Included build '.../android/null' does not exist` failure at EAS build time.
- **Shared strict TS config** (`tsconfig.base.json`): `strict`,
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc. Each workspace
  extends it.
- **ESLint + Prettier** at the root (`.eslintrc.cjs`, `.prettierrc.json`);
  `no-explicit-any` is an error.
- **Husky pre-commit** (`.husky/pre-commit`): `lint && typecheck && test`.
- **GitHub Actions CI** (`.github/workflows/ci.yml`):
  install → prisma generate → lint → typecheck → test → build.
- **Branding**: name `FoodStra` set in root/package names, `apps/mobile/app.config.ts`
  (`name`/`slug`/`scheme`), and `README.md` — final, not a placeholder.
- **Local infra**: `docker-compose.yml` (MySQL 8.4 + Redis 7).

## Key decisions

- **State/testing tooling**: backend + shared use **Vitest** (+ Supertest for the
  API); mobile uses **jest-expo** + React Native Testing Library.
- **Module resolution**: shared/mobile use `Bundler`; api uses `NodeNext` ESM.
  Root `typecheck`/`test`/`build` scripts build `@foodstra/shared` first so its
  emitted `dist` types are available to consumers.
- Chose **Prisma** (over Drizzle) for MySQL migrations/типing; `fullTextIndex`
  preview feature enabled for menu/restaurant search.

## Acceptance — PASS

`pnpm install && pnpm typecheck && pnpm test` all green
(shared 5 tests, api 6 tests, mobile 1 test). `pnpm lint` clean.
`pnpm -w typecheck` / `pnpm -w test` resolve to these root scripts.

## Resolved file paths of note

- `packages/shared/src/index.ts` — contract barrel export.
- `apps/api/src/app.ts` / `server.ts` — Express app factory + HTTP/Socket bootstrap.
- `apps/api/prisma/schema.prisma` — MySQL schema.

## Deviations

- None from the fixed stack. Assets (`icon.png`, `splash.png`, adaptive icon,
  favicon) referenced in `app.config.ts` are generated in Phase 6; not required for
  Phase 0 acceptance (typecheck/test/install).
