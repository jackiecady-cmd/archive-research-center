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
   PostgreSQL database.
2. Install dependencies:

   ```sh
   pnpm install
   ```

3. Create the database schema and load the reference data:

   ```sh
   pnpm db:push
   pnpm db:seed
   ```

4. Start the API and web app:

   ```sh
   pnpm dev
   ```

Open <http://localhost:5173>. The Vite development server forwards `/api`
requests to the API on port 8080.

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

This remains a preview-stage application. Authentication, payment and membership
flows, email, and external integrations are mocked or informational. Do not
expose this version as a multi-user service without implementing authentication,
authorization, and user-scoped data access.

The repository contains curated reference seed data, not a copy of the original
workspace's live database. Secrets, credentials, the design sandbox, generated
build output, and the original Git history are not included.
