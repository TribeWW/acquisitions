# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

- Install dependencies: `npm install`
- Start in watch mode: `npm run dev` (starts `src/index.js`, which loads `src/server.js` and the Express app)
- Lint: `npm run lint`
- Lint (auto-fix): `npm run lint:fix`
- Format: `npm run format`
- Format (check only): `npm run format:check`
- Database (Drizzle):
  - Generate SQL from schema: `npm run db:generate`
  - Apply migrations: `npm run db:migrate`
  - Open Drizzle Studio: `npm run db:studio`

Notes:
- Tests are not configured (no `test` script and no test config found). There is currently no command to run a single test.
- Database commands require a valid `drizzle-kit` configuration and `DATABASE_URL` to be set; ensure these exist in your environment before running the commands.

## High‑level architecture

This is a Node.js ESM Express API organized into modular layers. Import path aliases are configured via `package.json#imports` (e.g., `#config/*`, `#controllers/*`, etc.).

- Entrypoints
  - `src/index.js`: Loads environment variables via `dotenv/config`, then imports `src/server.js`.
  - `src/server.js`: Boots the HTTP server from the Express app on `PORT` (default 3000).
  - `src/app.js`: Composes the Express application.

- HTTP and middleware
  - Security and utilities: `helmet`, `cors`, `cookie-parser`.
  - Logging middleware: `morgan` configured to write through the custom Winston logger.
  - Body parsing: `express.json()` and `urlencoded()`.
  - Health and diagnostics: `GET /`, `GET /health`, `GET /api`.

- Routing and handlers
  - Routes live under `src/routes/`; e.g., `auth.routes.js` mounted at `/api/auth`.
  - Controllers under `src/controllers/` orchestrate request validation, services, and responses. Example: `auth.controller.js` handles `POST /api/auth/sign-up`.

- Validation
  - Zod schemas under `src/validations/` (e.g., `auth.validation.js`) validate payloads. Controllers call `safeParse()` and return structured 400s on validation failure.

- Services and data access
  - Business logic/services under `src/services/`; e.g., `auth.service.js` performs user lookups, hashing, insertion, and constructs the value returned to controllers.
  - Database is configured in `src/config/database.js` using `@neondatabase/serverless` and `drizzle-orm` (HTTP driver). Requires `DATABASE_URL`.
  - Relational schema lives in `src/models/`, e.g., `user.model.js` defines the `users` table (id, name, email unique, password, role, timestamps).

- Utilities
  - JWT helpers in `src/utils/jwt.js` (sign/verify with `JWT_SECRET`, 1d expiry by default).
  - Cookie helpers in `src/utils/cookies.js` centralize secure defaults and cookie operations.
  - Formatting helpers in `src/utils/format.js` (used for validation error shaping).

- Logging
  - `src/config/logger.js` defines a Winston logger with JSON format, file transports (`logs/error.lg`, `logs/combined.log`), and a colorized console transport in non‑production.
  - HTTP access logs flow through Morgan into the Winston logger.

## Environment

These variables are read at runtime; define them in your environment (e.g., `.env`) before running:
- `DATABASE_URL`: Neon connection URL for Drizzle.
- `PORT`: HTTP port (optional; defaults to 3000).
- `LOG_LEVEL`: Winston log level (optional; defaults to `info`).
- `JWT_SECRET`: Secret for JWT signing/verification (recommended; a development fallback is present but should be overridden).

## Module resolution

The project uses ESM (`"type": "module"`) and `package.json#imports` for path aliases:
- `#config/*` → `./src/config/*`
- `#controllers/*` → `./src/controllers/*`
- `#models/*` → `./src/models/*`
- `#routes/*` → `./src/routes/*`
- `#utils/*` → `./src/utils/*`
- `#services/*` → `./src/services/*`
- `#middleware/*` → `./src/middleware/*`
- `#validations/*` → `./src/validations/*`

This allows absolute‑style imports without `../../` traversal.
