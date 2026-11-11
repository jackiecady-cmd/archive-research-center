# App import mapping

How a READY language pack at `/workspace/language-packs/<slug>/` maps onto
the Archive & Research Center schema in
`/workspace/projects/archive-research-center/lib/db/src/schema/`.

This file is a mapping only. It does not change the app. Do not import a
pack until it has a `READY` file and every `publishedTranslation` / PDF
flag has been checked.

**Internal provenance is never imported.** A pack’s
`provenance.internal.md` (and any other `*.internal.md` file) is excluded
from public import, from pack PDFs, and from any customer-facing view.
Do not copy its contents into `aiAssistance`, `commentary`,
`literalTranslation`, `readableTranslation`, or any other public field.
Decided 11 November 2026 (t32s2): no public AI label; all AI provenance
stays internal. Public attribution is only
`publishedTranslationAttribution`, for rights-cleared published
translations.

The translations UI and API
(`artifacts/archive-research-center/src/pages/translation-workspace.tsx`,
`artifacts/api-server/src/routes/translations.ts`) use the same field names
as the `translations` table, in this epistemic order: `originalText`,
`transliteration`, `morphologyNotes`, `literalTranslation`,
`readableTranslation`, `publishedTranslation` +
`publishedTranslationAttribution`, `commentary`, `userInterpretation`,
`aiAssistance`. Pack headings are `### layer: <fieldName>` so an importer
can copy each section into that column with no remapping.

## Unit of import

- Each numbered block in `sources.md` → one row in `sources`.
- Each `## passage: N` block in `pack.md` → one row in `translations`,
  with `sourceId` set to the row created (or already found) for that
  passage’s `source_ref`.
- The app is **one translations workspace per source**
  (`GET /translations?sourceId=` returns or creates a single row). If two
  passages need two workspaces, they must have two `sources.md` numbers,
  even when they come from the same edition (put the line range in the
  title). Do not invent a second translations row for the same `sourceId`.
- Pack-level sections (front matter, dialect notes, uncertainties,
  reliability table, ready-to-use summary, key terms, the optional
  `### view: lineByLine` table) are **not** columns on `translations`.
  They stay in the pack files. A short reliability and uncertainty note
  may be copied into that passage’s `commentary` if it would otherwise be
  lost, but it is not a substitute for `pack.md`.
- `id`, `createdAt`, and `updatedAt` on both tables are assigned by the
  database. `repositoryId` is a foreign key: if `repositorySlug` is set
  and a matching `repositories.slug` exists, resolve it at import; never
  invent a numeric id.

## `pack.md` front matter → pack metadata / `sources`

| Pack front matter | App field | Notes |
|---|---|---|
| `title` | (pack only; may also seed `sources.title` context) | The source title comes from `sources.md`. |
| `slug` | (pack only) | Top-level folder name. |
| `date` | (pack only) | Pack date, not `sources.dateLabel`. |
| `source_language` | `sources.originalLanguage` (default if a source omits it) | Prefer the per-source value when present. |
| `target_languages` | (pack only) | Usually English. |
| `brief_slug` | (pack only) | Links to `/workspace/research/<slug>/`. No app column. |
| `case_study` | suggestion for grouping | `yeshua` or `hecate`. See collection slugs below. |
| `collection_slug` | `sources.collectionSlug` (default if a source omits it) | Must be an existing collections.slug, or a new one added to the app first. |
| `reliability` | maps to `sources.confidence` | See table below. |
| `license` | maps to `sources.availability` | See table below. Also drives PDF eligibility. |
| `status` | import gate | Import only when `status: final` and a `READY` file is present. |
| `author` | (pack only) | Lexicon, not the ancient author. Ancient authors go in `sources.author`. |

## `## passage` layers → `translations`

| Pack heading | `translations` column | Import rule |
|---|---|---|
| `source_ref` | `sourceId` (resolved) | Number of the `sources.md` entry. Required. |
| `passage_id`, `label` | (pack only) | Identifiers for humans and for commentary headings. |
| `### layer: originalText` | `originalText` | Canonical original-script text. |
| `### layer: transliteration` | `transliteration` | |
| `### layer: morphologyNotes` | `morphologyNotes` | |
| `### layer: literalTranslation` | `literalTranslation` | |
| `### layer: readableTranslation` | `readableTranslation` | Lexicon’s English, unless a PD/open published rendering is used and labelled. |
| `### layer: publishedTranslation` | `publishedTranslation` | Quote only PDF-OK (PD / CC-BY / CC-BY-SA) texts. REFERENCE-ONLY: do not quote at length; leave empty or a one-line pointer. |
| `### layer: publishedTranslationAttribution` | `publishedTranslationAttribution` | Full citation, or “Consulted, not quoted: … REFERENCE-ONLY.” |
| `### layer: commentary` | `commentary` | Lexicon’s contextual notes. |
| `### layer: userInterpretation` | `userInterpretation` | **Always import as empty** (or leave the column null). This layer is for Jacqueline / users. |
| `### layer: aiAssistance` | `aiAssistance` | **Always import as empty** (or leave the column null). Not a public disclosure field. Do not copy `provenance.internal.md` into this column. The layer, if present in a pack, should itself be empty. The current app UI may still badge the layer “AI — Not Evidence”; changing that badge is a later app task, not an import step. Never evidence. |
| `### view: lineByLine` | none | Optional view only. Do not invent a column for it. |
| `provenance.internal.md` | none | **Excluded from import.** Internal provenance only. |

`GET /translations/workspaces` treats a workspace as having content when
any of the layer fields (except attribution, which is omitted from that
list in the API) is non-empty. An imported passage should therefore have
at least `originalText` or a translation layer filled.

## `sources.md` → `sources`

| sources.md field | `sources` column | Notes |
|---|---|---|
| `title` | `title` | Required. |
| `sourceType` | `sourceType` | `primary` \| `translation` \| `scholarship` \| `interpretation` \| `ai_assistance` \| `conclusion`. Seed data today uses `primary` and `scholarship`. |
| `collectionSlug` | `collectionSlug` | See collections below. |
| `author` | `author` | |
| `dateLabel` | `dateLabel` | Human-readable date string, following seed style (`c. 116–117 CE`). |
| `yearApprox` | `yearApprox` | Integer; BCE as a negative (`-700`). Seed examples: `93`, `350`, `-100`. |
| `language` | `language` | Language of the stored excerpt/description. Seed often uses `English (translation)` when the excerpt is English, with the ancient language in `originalLanguage`. |
| `originalLanguage` | `originalLanguage` | e.g. `Greek (Koinē)`, `Hebrew (Biblical)`, `Latin`, `Sahidic Coptic`, `Sumerian`. |
| `provenance` | `provenance` | Required. |
| `confidence` | `confidence` | `high` \| `medium` \| `low` \| `uncertain`. Must agree with the reliability mapping. |
| `chronology` | `chronology` | Composition date, witness date, and the gap. |
| `availability` | `availability` | `public_domain` \| `open_access` \| `restricted` \| `fee_required`. |
| `rightsStatement` | `rightsStatement` | |
| `description` | `description` | Optional. |
| `excerpt` | `excerpt` | Optional; rights-cleared only. |
| `originalLanguageText` | `originalLanguageText` | Optional original-script excerpt on the source record. |
| `externalUrl` | `externalUrl` | |
| `repositoryAccessStatus` | `repositoryAccessStatus` | `digitized` \| `catalog_only` \| `restricted` \| `physical_access_required`. Omit if no repository. |
| `repositoryAccessNote` | `repositoryAccessNote` | |
| `repositorySlug` | resolves to `repositoryId` | Optional. Seeded example: `vatican-apostolic-library`. |
| `tags` | `tags` | Text array, required in schema (defaults to `[]`). |
| `pdf` | none | Pack-only. `PDF-OK` or `REFERENCE-ONLY`. Drives what may enter `publishedTranslation` and the pack PDF. |
| `reliability` | maps to `confidence` | Pack-only 1–5 score. |

## Reliability → `confidence`

Use the pack’s **overall** Lexicon score (already capped so it cannot sit
more than one point above the lowest of the seven criteria):

| Overall reliability | `sources.confidence` |
|---|---|
| 5 or 4 | `high` |
| 3 | `medium` |
| 2 | `low` |
| 1 | `uncertain` |

Do not upgrade `confidence` above this mapping. A pack may set a *lower*
confidence (for example overall 4, but `uncertain` because a specific
attribution is in doubt) — say why in `chronology` or `description`.

This is a different rubric from the narrative grades in
`seed-research.ts` (those describe interpolation risk on historical-Jesus
notes). On import, use the table above, not the seed-research prose, so
language packs stay consistent with `_templates/reliability-rubric.md`.

## License → `availability`

| Pack `license` / source rights | `sources.availability` | PDF / `publishedTranslation` |
|---|---|---|
| `PD` | `public_domain` | PDF-OK, may quote |
| `CC-BY`, `CC-BY-SA`, or other CC licence that allows redistribution (not NC) | `open_access` | PDF-OK, may quote, honor attribution and share-alike |
| `reference-only` because the work is in copyright and not openly licensed | `restricted` | REFERENCE-ONLY: cite, do not quote at length, no PDF |
| `reference-only` because access is paid (subscription, purchase) | `fee_required` | REFERENCE-ONLY |
| CC-BY-NC (or similar non-commercial-only terms) | `restricted` under the current archive PDF rule | REFERENCE-ONLY for PDFs unless the archive’s distribution is later confirmed to be non-commercial and the terms are met |
| Images or institutional scans with a no-commercial-reuse rule, while the text is PD | Text: `public_domain`; say so in `rightsStatement`. Images stay out of public/commercial PDFs. | Text may be PDF-OK; images are not |

Jurisdiction notes (US PD vs EU/UK still in copyright) belong in
`rightsStatement`. They do not get their own column.

## Collection slugs

### What already exists in the app

`lib/db/src/seed-research.ts` does **not** define collections. It only
creates two research *projects* (looked up by title, not slug):

- `Historical Jesus: Source Analysis` (`researcherType`: historian)
- `Burke Family Genealogy 1850–1920` (`researcherType`: genealogist)

and attaches already-seeded sources (Tacitus, Josephus, Pliny, the Pilate
inscription, the Isaiah Scroll, Codex Sinaiticus, the James ossuary,
and three genealogy/census records) plus notes and claim cards.

Collection slugs live in `lib/db/src/seed.ts`:

| `collections.slug` | Name | Subject |
|---|---|---|
| `greco-roman` | Greco-Roman Primary Sources | Classical antiquity |
| `ecclesiastical` | Ecclesiastical Manuscripts | Early Christian and Jewish literature |
| `parish-civil` | Parish & Civil Records | Genealogy and demographic history |
| `census` | Census & Population Registers | Demographic and social history |
| `numismatic` | Numismatic & Epigraphic Evidence | Material culture and epigraphy |

Convention: lowercase, hyphenated if needed (`parish-civil`), unique.
There is also one seeded *repository* slug,
`vatican-apostolic-library` (not a collection).

No `yeshua`, `hecate`, `inanna`, or `lilith` collection exists yet.

### What to use on import

Preferred long-term: add collections `yeshua` and `hecate` (and later
ones) to the app so `collectionSlug` can equal the case-study folder
name. That has **not** been done; this mapping must not insert a slug
the `collections` table does not have, because the UI groups by
`collectionSlug`.

Until those collections exist, use the seeded slugs that already fit
the material, and keep `case_study` on the pack for grouping:

| Case study / pack kind | `collectionSlug` to use now | Future slug (if added) |
|---|---|---|
| Yeshua — Hebrew Bible / NT / Coptic Christian / DSS context | `ecclesiastical` | `yeshua` |
| Yeshua — Josephus, Tacitus, Pliny, and other classical external witnesses | `greco-roman` (already how the seed files them) | `yeshua` or remain `greco-roman` |
| Hecate — Hesiod, Homeric Hymn, Orphic Hymn, PGM, Latin Trivia | `greco-roman` | `hecate` |
| Inanna / Sumerian literary | none of the five seeded slugs fit well; do not force `greco-roman` | a new collection, e.g. `mesopotamian`, when the app adds one |
| Lilith — Hebrew / rabbinic | `ecclesiastical` | a new collection, or `yeshua` only if it is truly part of that case study |

A pack may set `collection_slug` in front matter as the *intended* future
value (`yeshua`, `hecate`) and still write the fallback seeded slug on
each `sources.md` entry used for a live import, until the app has the new
collections.

## Existing seed sources that overlap Yeshua work

These titles are already in `seed.ts` and are attached to the Historical
Jesus project by `seed-research.ts`. A Yeshua pack should reuse the same
source row (match on `title`) rather than insert a duplicate:

- Tacitus, Annals XV.44 — Nero and the Christians
- Josephus, Antiquities of the Jews XVIII.3.3 — Testimonium Flavianum
- Pliny the Younger, Epistulae X.96 — Letter to Trajan on Christians
- Dead Sea Scrolls — Isaiah Scroll (1QIsa-a), Isaiah 53
- Codex Sinaiticus — New Testament (Matthew 5:3–12, Beatitudes)

If a pack’s passage is a *different* locus (for example a different
Sinaiticus leaf, or Isaiah 34:14 rather than Isaiah 53), it is a new
source row with a distinct title.

## Files excluded from public import

These pack files are never imported into `translations` or `sources`, and
they are never included in a pack PDF:

- `provenance.internal.md`
- any other `*.internal.md` in the pack folder or under `planning/`

The official public pack remains `pack.md`, `sources.md`, and rights-
cleared files under `raw/` that the pack actually cites for the source
text. Draft review PDFs (`*_DRAFT.pdf`) are rendered from `pack.md` plus
a `sources.md` appendix only.
