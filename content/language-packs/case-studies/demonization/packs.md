# Planned packs — Demonization

All paths are top-level under `content/language-packs/`. None of these
folders has been created. Status of every row: **planned**.

| Slug | Path | Focus | Status |
|---|---|---|---|
| `hebrew_baal_zebub` | `/workspace/language-packs/hebrew_baal_zebub/` | Baal Zebub of Ekron (2 Kings 1, WLC/OSHB) and Beelzebul in Mark 3:22 and Matthew 12:24 (SBLGNT); zebub/zebul debate | planned |
| `hebrew_shedim_deut32` | `/workspace/language-packs/hebrew_shedim_deut32/` | *Shedim* in Deuteronomy 32:17 and Psalm 106:37 (WLC/OSHB); Akkadian *šēdu* as etymological context, labelled as a hypothesis | planned |
| `greek_daimonia_lxx_ps96` | `/workspace/language-packs/greek_daimonia_lxx_ps96/` | LXX Psalm 95(96):5, “the gods of the nations are *daimonia*,” plus 1 Cor 10:20 and a short note on classical *daimōn* vs. Christian “demon.” Named PD LXX and SBLGNT | planned |
| `ugaritic_phoenician_astarte` | `/workspace/language-packs/ugaritic_phoenician_astarte/` | Ashtart / Astarte / biblical Ashtoreth, kept apart from later Astaroth. Ugaritic and Phoenician from named, rights-cleared editions only | planned |
| `latin_pseudomonarchia_weyer` | `/workspace/language-packs/latin_pseudomonarchia_weyer/` | Weyer, *Pseudomonarchia Daemonum* (1577, PD). Shared with the Goetia case study; do not create a second slug | planned |
| `french_grand_grimoire` | `/workspace/language-packs/french_grand_grimoire/` | *Grand Grimoire* / *Le Dragon Rouge* as reception. Flag uncertain dating (claimed 1521, probably 18th–19th c.). Historical/textual only; no ritual instruction | planned |

Possible later packs (not scheduled, not created): Molech/Moloch; Dagon;
Lilith / *lilitu* (may also be linked from a future Lilith or Mesopotamian
pack); Pazuzu and Lamashtu as context; 1 Corinthians 10:20 as a standalone
if it outgrows the LXX *daimonia* pack; Collin de Plancy, *Dictionnaire
Infernal* (`french_dictionnaire_infernal`). Goetia name-by-name work is
indexed under `../goetia/`, not duplicated here.

The Lilith / *lilītu* pack is shared (one top-level folder):

| Slug | Path | Focus | Status |
|---|---|---|---|
| `sumerian_lilith` | `content/language-packs/sumerian_lilith/` | **Owned under `../lilith/`.** Mesopotamian *líl* / *lilītu* passages; later Jewish and modern layers kept apart | draft |

## App import (when a pack is READY)

Field mapping: `content/language-packs/_templates/app-import-mapping.md`.
Until a `demonization` collection is added, import biblical sources with
`collectionSlug: ecclesiastical` and classical notes with `greco-roman`.
Weyer and the *Grand Grimoire* should not be silently filed as biblical.
Pack front matter may still set `case_study: demonization` and
`collection_slug: demonization` as the intended future value.
