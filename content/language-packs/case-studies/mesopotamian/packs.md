# Planned packs — Mesopotamian pantheon

All paths are top-level under `content/language-packs/`. None of these
folders has been created. Status of every row: **planned**.

| Slug | Path | Focus | Status |
|---|---|---|---|
| `sumerian_inanna_descent` | `/workspace/language-packs/sumerian_inanna_descent/` | Inanna’s Descent. CDLI text with attribution; ETCSL REFERENCE-ONLY (including for later AI-translation evaluation). Already listed as a priority text | planned |
| `sumerian_enki_ninhursag` | `/workspace/language-packs/sumerian_enki_ninhursag/` | Enki and Ninhursag, from a named CDLI / ORACC witness | planned |
| `sumerian_enlil_ninlil` | `/workspace/language-packs/sumerian_enlil_ninlil/` | Enlil and Ninlil, from a named CDLI / ORACC witness | planned |
| `akkadian_ishtar_descent` | `/workspace/language-packs/akkadian_ishtar_descent/` | Descent of Ishtar, Akkadian; keep distinct from the Sumerian Inanna descent | planned |
| `akkadian_atrahasis_enki_enlil` | `/workspace/language-packs/akkadian_atrahasis_enki_enlil/` | Atra-hasis, with the roles of Enki and Enlil; named edition / ORACC or CDLI text; modern translations often REFERENCE-ONLY | planned |

The Lilith / *lilītu* work is now a shared pack, already in draft:

| Slug | Path | Focus | Status |
|---|---|---|---|
| `sumerian_lilith` | `content/language-packs/sumerian_lilith/` | **Owned under `../lilith/`.** Sumerian/Mesopotamian *líl* and *lilītu* passages, with later layers as overviews | draft |

Possible later packs (not scheduled, not created): Ereshkigal; Enki and
the World Order; Inanna and Ebih; Enuma Elish (Marduk).

## App import (when a pack is READY)

Field mapping: `content/language-packs/_templates/app-import-mapping.md`.
Until a `mesopotamian` (or `sumerian` / `akkadian`) collection is added,
there is no close seeded slug; do not force these into `ecclesiastical`.
Pack front matter may set `case_study: mesopotamian` and
`collection_slug: mesopotamian` as the intended future value.
