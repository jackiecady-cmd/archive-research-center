# Planned packs — Yeshua

All paths are top-level under `content/language-packs/`. None of these
folders has been created. Status of every row: **planned**.

| Slug | Path | Focus | Status |
|---|---|---|---|
| `hebrew_aramaic_yeshua_name` | `/workspace/language-packs/hebrew_aramaic_yeshua_name/` | Etymology and biblical usage of Yeshua / Yehoshua; WLC/OSHB as the base text | planned |
| `greek_yeshua_nt_koine` | `/workspace/language-packs/greek_yeshua_nt_koine/` | Ἰησοῦς in the SBLGNT (CC BY 4.0), with notes on early witnesses | planned |
| `coptic_yeshua_sahidic` | `/workspace/language-packs/coptic_yeshua_sahidic/` | Sahidic NT portions and/or Gospel of Thomas Coptic text, licence per document | planned |

The following packs, when opened, should be **cross-listed** here and
are already planned under other case studies (one top-level folder each;
do not duplicate):

| Slug | Path | Focus | Status |
|---|---|---|---|
| `coptic_gospel_thomas` | `/workspace/language-packs/coptic_gospel_thomas/` | **Shared with `../gnostic/` and `../mary-magdalene/`.** Gospel of Thomas, Nag Hammadi Codex II, including saying 114 | planned |
| `greek_magdalene_canonical` | `/workspace/language-packs/greek_magdalene_canonical/` | **Owned under `../mary-magdalene/`.** Canonical Magdalene notices (Mk 15–16, Lk 8:2, Jn 20) | planned |

Possible later packs (not scheduled, not created): Syriac Peshitta name and
key passages; a short pack on Josephus / Tacitus / Pliny as external
references; a DSS context note. These would also be top-level slugs, then
linked from this table.

## App import (when a pack is READY)

Field mapping: `content/language-packs/_templates/app-import-mapping.md`.
Until a `yeshua` collection is added to the app, import sources with
`collectionSlug: ecclesiastical` (biblical, Coptic, DSS context) or
`greco-roman` (Josephus, Tacitus, Pliny — already the seeded slug for
those titles). Reuse the seeded source rows for Tacitus *Annals* XV.44,
Josephus *Antiquities* XVIII.3.3, Pliny *Ep.* X.96, 1QIsa-a Isaiah 53, and
Codex Sinaiticus Matthew 5:3–12 rather than duplicating them. Pack front
matter may still set `case_study: yeshua` and `collection_slug: yeshua` as
the intended future value.
