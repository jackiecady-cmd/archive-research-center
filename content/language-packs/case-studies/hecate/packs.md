# Packs — Hecate

All paths are top-level under `content/language-packs/`. Pack folders
are not created until work on that pack starts, except as noted below.

| Slug | Path | Focus | Status |
|---|---|---|---|
| `greek_hecate_theogony` | `content/language-packs/greek_hecate_theogony/` | Hesiod, *Theogony* 411–452, from Evelyn-White 1914 (US and EU/UK PD) via Perseus. Folder created 10 November 2026. **Draft for review; no READY file.** | draft |
| `greek_hecate_hymns` | `/workspace/language-packs/greek_hecate_hymns/` | *Homeric Hymn to Demeter* (Hecate passages) and Orphic Hymn 1. Prefer Evelyn-White 1914 (US PD) for the Homeric Hymn; a PD Greek plus Taylor 1792 for the Orphic hymn. *Theogony* 411–452 is now its own pack (`greek_hecate_theogony`) and is not part of this one. | planned |
| `greek_hecate_pgm` | `/workspace/language-packs/greek_hecate_pgm/` | PGM Hecate–Selene hymns, Greek from Preisendanz vol. 1 (1928, US PD) with EU/UK warning. Betz = REFERENCE-ONLY | planned |

Possible later packs (not scheduled, not created): a Latin *Trivia* reception
pack; a defixiones pack; a Chaldean Oracles fragment pack if a PDF-OK Greek
text can be named; a fuller epithets pack expanding `epithets.md`.

## App import (when a pack is READY)

Field mapping: `content/language-packs/_templates/app-import-mapping.md`.
Until a `hecate` collection is added to the app, import sources with
`collectionSlug: greco-roman` (the existing seeded collection for classical
literary and documentary texts). Pack front matter may still set
`case_study: hecate` and `collection_slug: hecate` as the intended future
value. Do not import `greek_hecate_theogony` while it remains a draft
without a READY file.
