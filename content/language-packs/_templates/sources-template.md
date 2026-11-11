# Sources: <pack slug>

One numbered entry per `sources` table row. Field names match
`lib/db/src/schema/sources.ts` exactly (plus two pack-only flags at the end).
`source_ref` in `pack.md` uses these numbers. Allowed enum values are taken
from the schema comments and from `lib/db/src/seed.ts`.

Pack-only flags (not columns on `sources`):
- **pdf:** `PDF-OK` or `REFERENCE-ONLY` — whether this work may go into a pack PDF
  or into the `publishedTranslation` layer. REFERENCE-ONLY works are cited, not
  quoted at length.
- **reliability:** Lexicon 1–5 score (see `_templates/reliability-rubric.md`).
  On import this maps to `confidence` (5–4 high, 3 medium, 2 low, 1 uncertain).
  If you set `confidence` by hand, it must not be more optimistic than that
  mapping, and the rubric cap still applies (overall cannot sit more than one
  point above the lowest criterion).

Copy the block for each source. Leave a field blank only when the schema
allows null; `title`, `sourceType`, `provenance`, `confidence`, `availability`,
and `tags` are required by the table.

```
source: 1
title: "<Title, including work and locus where useful>"
sourceType: primary          # primary | translation | scholarship | interpretation | ai_assistance | conclusion
collectionSlug: "<greco-roman | ecclesiastical | parish-civil | census | numismatic | yeshua | hecate | … — see app-import-mapping.md>"
author: "<Author or editor, or Unknown>"
dateLabel: "<Human date, e.g. c. 700 BCE; 1914; c. 330–360 CE (copy)>"
yearApprox: <integer year of composition or of the witness used; BCE as a negative, e.g. -700>
language: "<Language of the stored excerpt / description, e.g. English (translation) or Greek (Koinē)>"
originalLanguage: "<Language of the ancient or source text, e.g. Greek (Koinē), Hebrew (Biblical), Sahidic Coptic, Sumerian, Latin>"
provenance: "<Where the text comes from: excavation, manuscript tradition, holding institution, edition.>"
confidence: high             # high | medium | low | uncertain  — must agree with reliability mapping
chronology: "<Date of composition, date of the witness actually used, and the gap between them.>"
availability: public_domain  # public_domain | open_access | restricted | fee_required
rightsStatement: "<Short rights note, e.g. US public domain (Evelyn-White 1914). Images © holding institution.>"
description: "<Optional. What this source is and why it is in the pack.>"
excerpt: "<Optional. A short rights-cleared quotation or paraphrase.>"
originalLanguageText: |
  <Optional. The original-script excerpt; may also appear in pack.md originalText.>
externalUrl: "<URL to the edition, CDLI/ORACC/Perseus/Sefaria page, or catalogue>"
repositoryAccessStatus: digitized   # digitized | catalog_only | restricted | physical_access_required — omit if no repository
repositoryAccessNote: "<Optional. Access caveat, e.g. images non-commercial; catalogue only.>"
repositorySlug: "<Optional. Matches repositories.slug if one is already seeded, e.g. vatican-apostolic-library. Do not invent a numeric repositoryId.>"
tags: ["<tag>", "<tag>"]
pdf: PDF-OK                  # PDF-OK | REFERENCE-ONLY
reliability: 4               # 1–5, Lexicon rubric
```

```
source: 2
title: "<e.g. Betz, The Greek Magical Papyri in Translation>"
sourceType: translation
collectionSlug: "greco-roman"
author: "Hans Dieter Betz (ed.)"
dateLabel: "1986/1992"
yearApprox: 1992
language: "English (translation)"
originalLanguage: "Greek (Koinē)"
provenance: "University of Chicago Press edition of the PGM, used as a scholarly comparandum only."
confidence: high
chronology: "Modern English translation of late-antique papyri."
availability: restricted
rightsStatement: "In copyright. REFERENCE-ONLY. Cite, do not quote at length, do not place in a pack PDF or in publishedTranslation."
description: "Standard English translation of the Greek Magical Papyri. Consulted to check a reading; wording is not imported."
excerpt:
originalLanguageText:
externalUrl: "https://press.uchicago.edu/ucp/books/book/chicago/G/bo3684249.html"
repositoryAccessStatus:
repositoryAccessNote:
repositorySlug:
tags: ["PGM", "Hecate", "REFERENCE-ONLY"]
pdf: REFERENCE-ONLY
reliability: 5
```
