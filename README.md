# Archive & Research Center

The Archive & Research Center is a provenance-aware research workspace for
finding archival sources, exploring collections, and organizing scholarly
research. This repository is a standalone extraction of the web app, API,
database schema, and generated API contracts.

## Requirements

- Node.js 22.13 or newer
- pnpm 10
- PostgreSQL

## Run locally

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to a development
   PostgreSQL database. Set `CORS_ORIGINS` to the web origin (the default is
   `http://localhost:5173`). Leave `TRUST_PROXY` unset unless a reverse proxy
   is in front of the API.
2. Install dependencies:

   ```sh
   pnpm install
   ```

3. Create the database schema and load the reference data:

   ```sh
   pnpm db:push
   pnpm db:seed
   ```

   `pnpm db:push` adds required account and ownership columns. If it fails
   because an older database already has research, forum, or translation rows,
   recreate that development database (or delete those rows) and push again.
   Catalog tables for sources, collections, and repositories do not need an
   owner. Seeded research and forum rows are assigned to `seed@archive.local`.
   That account is created with a random password that is not saved, so it
   cannot be used to sign in.

4. Start the API and web app:

   ```sh
   pnpm dev
   ```

   `pnpm dev` runs the API with `NODE_ENV=development`. The production start
   command (`pnpm --filter @workspace/api-server start`) sets
   `NODE_ENV=production`, which marks the session cookie `Secure`.

Open <http://localhost:5173>. The Vite development server forwards `/api`
requests to the API on port 8080. Create an account from Sign up. To make the
first administrator, set `ADMIN_EMAIL` to that address before registering or
signing in. To change a role later:

```sh
ADMIN_EMAIL=you@example.com pnpm db:set-role
pnpm db:set-role -- you@example.com editor
```

Roles are `user`, `editor`, and `admin`. Editors and administrators can change
catalog records. Research projects, notes, saved sources, claim cards,
evidence, and translation workspaces are visible only to their owner (an
administrator can also read and change research items).

## Checks and builds

```sh
pnpm typecheck
pnpm build
```

To regenerate the React Query client and Zod API schemas from the OpenAPI
contract, run `pnpm api:codegen`.

## Database safety

`pnpm db:push` applies the checked-in Drizzle schema to the database named by
`DATABASE_URL`. Use a local or disposable development database; do not point it
at production unless you intend to update that database.

## Project layout

- `artifacts/archive-research-center` — React and Vite web app
- `artifacts/api-server` — Express API
- `lib/db` — PostgreSQL schema and seed scripts
- `lib/api-spec` — OpenAPI contract and code generation
- `lib/api-client-react` and `lib/api-zod` — generated API client and validators

## Current boundaries

Accounts, server-side sessions, and ownership checks are implemented in this
repository. Membership and payment flows are still informational and are not
stored. Email delivery and external integrations are not wired up.

The repository contains curated reference seed data, not a copy of the original
workspace's live database. Secrets, credentials, the design sandbox, generated
build output, and the original Git history are not included.
