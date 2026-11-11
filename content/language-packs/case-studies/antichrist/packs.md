# Planned packs — Antichrist

All paths are top-level under `content/language-packs/`. None of these
folders has been created. Status of every row: **planned**.

| Slug | Path | Focus | Status |
|---|---|---|---|
| `greek_antichristos_johannine` | `/workspace/language-packs/greek_antichristos_johannine/` | ἀντίχριστος in 1 John 2:18, 2:22, 4:3 and 2 John 7; SBLGNT (CC BY 4.0) as the base Greek | planned |
| `greek_2thess_lawlessness` | `/workspace/language-packs/greek_2thess_lawlessness/` | 2 Thessalonians 2:3–4 “man of lawlessness,” including notable textual variants; SBLGNT. Note that the passage does not use ἀντίχριστος | planned |
| `greek_revelation_coded_rome` | `/workspace/language-packs/greek_revelation_coded_rome/` | Revelation as coded political critique under Roman persecution (666/616 and *Nerōn Qesar*; P115; Irenaeus V.30; Babylon / seven hills; Nero *redivivus*; Domitian vs Nero dating; debated persecution evidence). SBLGNT; ANF and pre-1930 PD Loeb / PD English for the Latin and Sibylline material; P.Oxy. images LINK-ONLY. **Confirm pending** that this is the pack Jacqueline wants | planned |
| `arabic_dajjal_hadith` | `/workspace/language-packs/arabic_dajjal_hadith/` | al-Masīḥ ad-Dajjāl as a parallel Islamic tradition. Rights-cleared Arabic and a PD or openly licensed English only; modern translations REFERENCE-ONLY | planned |

Possible later packs (not scheduled, not created): `hebrew_aramaic_daniel_7_11` (WLC/OSHB background); a dedicated Latin patristic pack expanding Irenaeus V.25–30 and Hippolytus if that material is not already enough in the Revelation pack. These would also be top-level slugs, then linked here.

## App import (when a pack is READY)

Field mapping: `content/language-packs/_templates/app-import-mapping.md`.
Until an `antichrist` collection is added to the app, import sources with
`collectionSlug: ecclesiastical` (Johannine epistles, 2 Thessalonians,
Revelation, Daniel, ANF patristics) or `greco-roman` (Tacitus, Suetonius,
Pliny — reuse seeded source rows for Tacitus *Annals* XV.44 and Pliny
*Ep.* X.96 rather than duplicating them). Hadith sources should not be
silently filed as biblical. Pack front matter may still set
`case_study: antichrist` and `collection_slug: antichrist` as the intended
future value.
