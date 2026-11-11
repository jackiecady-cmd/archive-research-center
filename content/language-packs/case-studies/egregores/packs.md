# Planned packs — Egregores

All paths are top-level under `content/language-packs/`. None of these
folders has been created. Status of every row: **planned**.

| Slug | Path | Focus | Status |
|---|---|---|---|
| `greek_egregoroi_enoch` | `/workspace/language-packs/greek_egregoroi_enoch/` | Greek ἐγρήγοροι in 1 Enoch: Codex Panopolitanus / Akhmim fragment and Syncellus excerpts. Prefer a named PD Greek (e.g. as printed in R. H. Charles, 1912) | planned |
| `aramaic_irin_daniel_qumran` | `/workspace/language-packs/aramaic_irin_daniel_qumran/` | Aramaic ʿir / ʿirin in Daniel 4:13, 17, 23 (WLC/OSHB) and the Qumran Enoch fragments (4QEn). DSS plates LINK-ONLY; modern editions (Milik, etc.) REFERENCE-ONLY | planned |
| `french_egregore_levi` | `/workspace/language-packs/french_egregore_levi/` | Later occult sense: Éliphas Lévi and 19th-c. French esotericism, clearly labelled as reception, not as ancient philology. PD French (Lévi d. 1875) and a rights-cleared older English if one exists | planned |

Possible later packs (not scheduled, not created): a Ge‘ez 1 Enoch watchers
pack if a PDF-OK Ethiopic text and a PD English (Charles 1912) can be paired;
a short note on Golden Dawn / Martinist / modern “group mind” usage as
further reception. These would also be top-level slugs, then linked here.

## App import (when a pack is READY)

Field mapping: `content/language-packs/_templates/app-import-mapping.md`.
Until an `egregores` collection is added to the app, import sources with
`collectionSlug: ecclesiastical` (Daniel, Enoch, Qumran) or, for Lévi and
later occult prints, the closest existing seeded slug — and do not file
Lévi under a biblical collection without a note. Pack front matter may
still set `case_study: egregores` and `collection_slug: egregores` as the
intended future value.
