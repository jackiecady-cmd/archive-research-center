# Packs — Lilith

All paths are top-level under `content/language-packs/`. Pack folders
are not created until work on that pack starts, except as noted below.

| Slug | Path | Focus | Status |
|---|---|---|---|
| `sumerian_lilith` | `content/language-packs/sumerian_lilith/` | Layer 1 full passages: GEN ḫalub-tree *ki-sikil lil₂-la₂* (CDLI Q000364; ETCSL locator only); Utukkū Lemnūtu *lilû / lilītu / ardat-lilî* (Thompson 1903 PD; Geller 2016 REFERENCE-ONLY); King List *lil₂-la₂* (Langdon 1923 PD, flagged); Burney Relief LINK-ONLY, identification contested. Layers 2–4 as shorter overviews. Offerings: informational only. Folder created 11 November 2026. **Draft for review; no READY file.** | draft |

Possible later packs (not scheduled, not created; one top-level folder
each, then cross-listed): `hebrew_lilith_isaiah34` (if Isaiah is later
split out of the overview); `hebrew_alphabet_ben_sira` and
`aramaic_incantation_bowls`, already planned under `../judaism/`.

## App import (when a pack is READY)

Field mapping: `content/language-packs/_templates/app-import-mapping.md`.
Until a `lilith` collection exists, Mesopotamian sources may be imported
with a future `collectionSlug: mesopotamian`; Isaiah, Bavli, and bowls
may use `ecclesiastical`. Pack front matter may set `case_study: lilith`
and `collection_slug: lilith`. Do not import `sumerian_lilith` while it
remains a draft without a READY file.
