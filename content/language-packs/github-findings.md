# GitHub findings: Jacqueline’s language / translation archive

Searched 10 November 2026, about 5:40–5:46 PM America/Chicago, before any
scrapes. Goal: locate or confirm a public GitHub repository or organization
that is Jacqueline’s language-and-translation center / archive (handles
suggested: Jacqueline, learningonyourcouch and variants, “archive center,”
“language translation,” Brightside Digital, plus occult / ancient / goddess /
Sumerian / Coptic terms).

**Result: no public GitHub user, organization, or repository can be confirmed
as hers.** Nothing matching the suggested handles holds a language, translation,
or occult-archive corpus. Empty name-alike accounts exist; they have no public
repos and no identifying bio, so they are not treated as hers.

## What was searched

- Unauthenticated GitHub REST API (`/users/{name}`, `/search/users`,
  `/search/repositories`), User-Agent `Lexicon-Archive-Research/1.0`.
- Web search for the same strings, including Instagram / YouTube / TikTok
  mentions of `learningonyourcouch`.
- Cursor GitHub connector (`cursor-github`): **not connected** (`needsAuth`).
  Private or Cursor-granted repos could not be listed. This search is public
  only.
- Cursor Origin (`cursor-origin-list_namespaces`): connected, but the account
  has **no Origin namespaces**, so no Origin-hosted archive is visible either.

## Exact username / org lookups

| Lookup | Result | URL |
|---|---|---|
| `learningonyourcouch` | 404, no such user | — |
| `learning-on-your-couch` | 404 | — |
| `learning_on_your_couch` | 404 | — |
| `LearningOnYourCouch` | 404 | — |
| `learningonyourcouch-archive` | 404 | — |
| `lexicon-archive`, `occult-archive`, `language-packs`, `jacqueline-lexicon`, `lexicon-brightside`, `brightsidedigitalio`, `BrightsideDigitalIO`, `brightside_digital` | 404 | — |
| `brightsidedigital` | User exists; **0 public repos**; no name, no bio; created 30 March 2022 | https://github.com/brightsidedigital |
| `Brightside-Digital` | Organization exists; **0 public repos**; no name, no bio; created 5 October 2021 | https://github.com/Brightside-Digital |

The two Brightside accounts are name-alikes only. They cannot be tied to
Jacqueline, to learningonyourcouch, or to an occult / language archive from
anything public.

## Quoted repository and user searches

Exact-phrase searches (these do not pick up incidental uses of “learning” or
“couch”):

- Repositories: `"learningonyourcouch"`, `"learning-on-your-couch"`,
  `"learning on your couch"` — **0 results**.
- Users: `learningonyourcouch in:login,name,bio,email` — **0 results**.
- Repositories: `"Brightside Digital" Jacqueline` — **0 results**.
- Users: `"Brightside Digital" in:bio` — **0 results**.

Broader unquoted searches returned thousands of unrelated repositories
(generic “learning,” people named Jacqueline, and so on) and were discarded.
A search for `"brightside digital"` in repo name/description/readme returned
five unrelated lead-scraper and startup-agent repos; none are an archive and
none can be tied to Jacqueline.

## Nearby people and orgs (not identified as hers)

These turned up in name searches. They are recorded so the misses are
auditable. **None is treated as Jacqueline’s archive.**

- **Jacqueline Delgado**, https://github.com/jdbostonbu-ops — public name
  “Jacqueline”; MS in Criminal Justice; Next Chapter software apprenticeship
  (Connecticut, 2026). 47 public repos, all apprenticeship / portfolio /
  app-demo work (AnglerCast, Next-Chapter-Labs, BlockScore, etc.). A keyword
  scan of names and descriptions hit only three uses of the word “archive”
  (fishing spots, a family-tradition app, a culinary folio). No Sumerian,
  Coptic, Hebrew, goddess, occult, translation-center, or
  learningonyourcouch material.
- **Thomas Gibbons / Brightside Digital io**, https://brightsidedigital.io/ —
  an Irish digital-marketing and web agency. GitHub:
  https://github.com/thomasfgibbons (0 public repos). No public tie to
  Jacqueline, occult research, or a language archive.
- Other GitHub users named Jacqueline (for example https://github.com/jacqueline,
  https://github.com/jacqueline-he, https://github.com/Jacquelinett) have no
  public connection to this project and were not investigated further.

Web search for `learningonyourcouch` / `learning on your couch` as a brand
handle also returned no site, Instagram, YouTube, or TikTok that belongs to
this Jacqueline. Hits were unrelated “learn on your couch” marketing copy
and other people’s counselling businesses.

## What this does — and does not — mean

The language-and-translation center is **not locatable as a public GitHub
repository** under the names we were given. It may be private, under a
different handle, on another host, or not yet published. This search cannot
see private repos, and the Cursor GitHub connector is not signed in.

To settle it, Jacqueline can send the exact GitHub URL or org name, or
connect GitHub in Cursor if the repo is private and should be used as a
source. Until then, Lexicon will keep building packs in
`content/language-packs/` and will not assume any of the empty Brightside
accounts, or any similarly named Jacqueline, is the archive.

No repositories were cloned. No scrapes were started from this search.

---

## Confirmed repo (10 November 2026, about 7:15 PM America/Chicago)

Jacqueline confirmed that the Archive & Research Center code lives at
**https://github.com/jackiecady-cmd/archive-research-center**
(`jackiecady-cmd/archive-research-center`). She also said the repository
is still being created: Copilot is pushing the exported code, so it may
be empty or not yet visible.

**Status: pending upload.**

A single read-only check was made, and it was not repeated:

- The Cursor GitHub connector, signed in as
  [jackiecady-cmd](https://github.com/jackiecady-cmd), could not see the
  repository (Cursor’s GitHub App has not been granted access, or the
  repo is not there yet). Those tools were not called on this repository
  again.
- One unauthenticated request to
  `https://api.github.com/repos/jackiecady-cmd/archive-research-center`
  returned **HTTP 404 Not Found** (about 7:15 PM America/Chicago). A 404
  from the public API also occurs when a repository is private, so this
  does not prove the name is wrong.

Visibility, default branch, last commit, and a file-level comparison with
`/workspace/projects/archive-research-center` could not be done. **The
local copy at `/workspace/projects/archive-research-center` is the source
of truth for now.** Pack templates and the import mapping were written
against that local schema.

No files were created, pushed, or modified on GitHub.

## Connected account, earlier the same evening

After GitHub was connected in Cursor, `get_me` and `list_my_repositories`
(all visibilities, including a second page) ran as
[jackiecady-cmd](https://github.com/jackiecady-cmd)
(account created 17 November 2025, 11:45 AM America/Chicago). The only
repository the App could list was:

| Full name | URL | Visibility | Last push | Last metadata update |
|---|---|---|---|---|
| `jackiecady-cmd/PromptProAcademy` | https://github.com/jackiecady-cmd/PromptProAcademy | public | 10 November 2026, 7:03 PM America/Chicago | 16 August 2026, 1:24 PM America/Chicago |

That repository is **not** the Archive & Research Center app. Its
`package.json` name is `rest-express` (the local app is
`archive-research-center`). It has no root README (a `replit.md` describes
PromptPro Academy). The layout is a Replit
Express/Vite app (`client/`, `server/`, `shared/`), not the local pnpm
monorepo (`artifacts/`, `lib/db/`, `pnpm-workspace.yaml`). A search for
any repository named `archive-research-center` also returned no results
at that time.

The empty public name-alikes noted above
(`https://github.com/brightsidedigital`,
`https://github.com/Brightside-Digital`) still have no confirmed tie to
this archive.



## Update 2026-11-10 7:36 PM CT: confirmed and verified
Repo https://github.com/jackiecady-cmd/archive-research-center is public, default branch `main`, with one commit (0ae2478, 2026-11-10 7:01 PM CT, "Import standalone Archive & Research Center app and backend"). It has 216 files. It's identical to /workspace/projects/archive-research-center except that the repo also has .env.example, .gitignore and .npmrc. The GitHub repo is the source of truth from here on.
