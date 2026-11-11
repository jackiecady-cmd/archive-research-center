# Planned packs — Goetia

All paths are top-level under `content/language-packs/`. None of these
folders has been created. Status of every row: **planned**.

| Slug | Path | Focus | Status |
|---|---|---|---|
| `latin_pseudomonarchia_weyer` | `/workspace/language-packs/latin_pseudomonarchia_weyer/` | Weyer, *Pseudomonarchia Daemonum* (1577, PD). Shared with `../demonization/`; one pack, two indexes | planned |
| `english_ars_goetia_sloane` | `/workspace/language-packs/english_ars_goetia_sloane/` | Ars Goetia from a named 17th-c. English manuscript tradition (Sloane 2731 / 3825, Harley 6483 as witnesses). BL images LINK-ONLY. Historical/textual only | planned |
| `greek_testament_solomon` | `/workspace/language-packs/greek_testament_solomon/` | *Testament of Solomon*, Greek, with the 1st–5th c. dating debate flagged. Prefer a PD Greek (e.g. McCown 1922 if confirmed PD) and a PD English (e.g. Conybeare 1898) | planned |

Possible later packs (not scheduled, not created): a *Hygromanteia* pack
if a PDF-OK Greek text can be named (modern editions are usually
REFERENCE-ONLY); a *Clavicula Salomonis* manuscript-tradition pack; a
short pack on the 1904 Mathers/Crowley *Goetia* once PD status is
confirmed, clearly labelled as early-20th-c. reception. The 72-spirit
stub in `spirits.md` is filled as those packs proceed, not in advance as
a working list.

## App import (when a pack is READY)

Field mapping: `content/language-packs/_templates/app-import-mapping.md`.
Until a `goetia` collection is added, import the *Testament of Solomon*
with `collectionSlug: ecclesiastical` or `greco-roman` as fits the seeded
slugs, and do not file Weyer or the Ars Goetia as biblical. Pack front
matter may still set `case_study: goetia` and `collection_slug: goetia`
as the intended future value. The shared Weyer pack should also carry
`case_study` notes for `demonization`.
