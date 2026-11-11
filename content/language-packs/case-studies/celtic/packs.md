# Planned packs — Celtic

All paths are top-level under `content/language-packs/`. None of these
folders has been created. Status of every row: **planned**.

| Slug | Path | Focus | Status |
|---|---|---|---|
| `old_irish_cath_maige_tuired` | `/workspace/language-packs/old_irish_cath_maige_tuired/` | *Cath Maige Tuired*, including the Morrígan and the Tuatha Dé Danann, from a named Old/Middle Irish text. CELT licence **check**. Older PD editions (Stokes and others) preferred for PDFs where they are sound | planned |
| `middle_welsh_mabinogi` | `/workspace/language-packs/middle_welsh_mabinogi/` | The Four Branches, Middle Welsh from a named PD or open edition; Guest’s English is US PD and may be used as a historical published layer | planned |
| `gaulish_larzac` | `/workspace/language-packs/gaulish_larzac/` | The Larzac lead tablet, with Chamalières as a companion note if space allows. Named RIG / edition; modern commentaries often REFERENCE-ONLY. Flag uncertainties | planned |

Possible later packs (not scheduled, not created): *Lebor Gabála Érenn*;
*Táin Bó Cúailnge*; Book of Taliesin; a short Caesar / Pliny pack on
druids (`latin_caesar_pliny_druids`).

## App import (when a pack is READY)

Field mapping: `content/language-packs/_templates/app-import-mapping.md`.
Until a `celtic` collection is added, Caesar and Pliny may use
`collectionSlug: greco-roman`. Medieval Irish and Welsh should not be
filed as classical without a note. Pack front matter may set
`case_study: celtic` and `collection_slug: celtic` as the intended
future value.
