# Archive & Research Center

The Archive & Research Center is a provenance-aware research workspace for
finding archival sources, exploring collections, and organizing scholarly
research. This repository is a standalone extraction of the web app, API,
database schema, and generated API contracts.

Forums, private rooms, and uploads are not cleared to go public until the
items in [LAUNCH_BLOCKERS.md](LAUNCH_BLOCKERS.md) are done.

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

   `pnpm db:push` adds account, entitlement, forum, comp-code, and private-room
   columns. If it fails
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

Roles are `user`, `editor`, `moderator`, and `admin`. Editors and administrators
can change catalog records. Moderators can hide posts, lock discussions, and
suspend forum access. Administrators can do that too, and they are the only
people who can read the moderation audit log. Research projects, notes, saved
sources, claim cards, evidence, and translation workspaces are visible only to
their owner (an administrator can also read and change research items). Forum
threads and replies follow the same rule: another researcher cannot edit or
delete them.

## Access

Sign-in is required for the research concierge, including both concierge API
routes. Signed-out visitors see a prompt to sign in.

Public forum categories (Sources, Methodology, Translation, Interpretation,
Chronology) can be read without an account. Posting and replying require a
signed-in account that is not suspended. Hidden posts are omitted from those
public reads. Private rooms never appear there.

Access is an entitlement: `free`, `paid`, or `comp`. A future billing provider
should set `users.billing_entitlement` to `paid` or `free`. Comp is a separate
grant and overrides billing, so a comp account has every paid privilege until
an administrator revokes the code that granted it. Codes are single-use by
default, stored as a SHA-256 hash (mix in `COMP_CODE_PEPPER` in production),
and redemption is rate-limited per account and per IP. A code binds to the
first account that redeems it. A later attempt from a different account is
refused with the same message as an invalid code, and the holder keeps
access. That attempt is stored for the administrator and the comp delegate,
including the IP address and user agent, and can be sent to
`COMP_INCIDENT_WEBHOOK_URL` when that variable is set. `COMP_INCIDENT_NOTIFY_EMAIL`
selects an address for a future mail transport and does not send mail.
`LEGAL_PAGES_LIVE` defaults off. Legal drafts stay unrouted until it is set,
and any draft that still contains a `[BRACKETED]` placeholder stays unrouted
even then. Administrators can preview those drafts. Retention variables
(`RETENTION_COMP_CODE_INCIDENTS`, `RETENTION_CLOSED_ACCOUNTS`,
`RETENTION_FORUM_POSTS`, `RETENTION_PRIVATE_ROOM_MESSAGES`) have no default
period. If one is unset, the API logs a warning at startup and does not
delete those records.
Only an administrator, plus at most one designated delegate, can create
codes. Revoking a code removes the comp grant.
If the account also has paid billing, it falls back to paid. Otherwise it
returns to free.

`POST /api/membership/subscribe` does not grant access. Billing is not
connected.

Private rooms are invitation-only. Non-members receive "not found" rather than
the room's contents. The owner creates and revokes invitations and removes
members. Invitations can expire. Moderators and administrators can open a room
for safety (hide it, lock it, hide a post) even when they are not members.

Open question: whether a signed-in researcher without paid or comp access may
be invited. The default is members-only. Set
`PRIVATE_ROOMS_ALLOW_FREE_GUESTS=1` to allow free accounts to join. Staff
roles can still enter for moderation.

Moderator accounts that are bots should be service accounts. An administrator
creates one from the account page (or `POST /api/moderation/service-accounts`).
The response includes a bearer token once. Send it as `Authorization: Bearer`
from the server. That path does not create a browser session, and the service
account cannot sign in through the password form.

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
at production unless you intend to update that database. The translation
workspace no longer has a machine-draft column: `translations.ai_assistance`
is dropped on the next push because that text was only shown in the removed
workspace layer. English translations shown in the catalog, the translation
workspace, and translation API responses include `TRANSLATION_DISCLOSURE`
from `@workspace/config`. That wording is pending legal review. Public
responses do not include model or provider names. Re-run `pnpm db:seed` and
`pnpm db:seed:research` to refresh sample catalog rows.

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
