# Planned packs — Mary Magdalene

All paths are top-level under `content/language-packs/`. None of these
folders has been created. Status of every row: **planned**. Shared slugs
are one pack, listed also from `../gnostic/` and/or `../yeshua/`.

| Slug | Path | Focus | Status |
|---|---|---|---|
| `greek_magdalene_canonical` | `/workspace/language-packs/greek_magdalene_canonical/` | Canonical notices: Mk 15–16 (flag the longer ending, 16:9–20, ⚠️ UNCERTAIN), Lk 8:2 and related Lukan verses, Jn 20. Prefer SBLGNT (CC BY 4.0) or a named PD Greek text. Recent Bible English REFERENCE-ONLY. May be cross-listed with `../yeshua/` | planned |
| `coptic_gospel_mary` | `/workspace/language-packs/coptic_gospel_mary/` | **Shared with `../gnostic/`.** Gospel of Mary: Berlin Codex 8502 (Coptic) and Greek fragments P.Oxy. 3525 and P.Ryl. 463. Rights-cleared Coptic/Greek only; modern English (King, Tuckett, and others) REFERENCE-ONLY | planned |
| `coptic_gospel_philip_magdalene` | `/workspace/language-packs/coptic_gospel_philip_magdalene/` | **Also listed under `../gnostic/`.** Gospel of Philip, NHC II,3: *koinōnos*, and the lacuna at 63:34–36 (⚠️ UNCERTAIN; do not state a kiss or a marriage as fact). Rights-cleared Coptic only; modern NHL English REFERENCE-ONLY | planned |
| `coptic_pistis_sophia` | `/workspace/language-packs/coptic_pistis_sophia/` | **Shared with `../gnostic/`.** Mary as interlocutor in *Pistis Sophia*. Mead 1896 English is a PD historical translation (quality warning); Coptic only if a cleared text is named | planned |
| `coptic_dialogue_savior` | `/workspace/language-packs/coptic_dialogue_savior/` | **Also listed under `../gnostic/`.** *Dialogue of the Savior*, NHC III,5, Mary as interlocutor. Rights-cleared Coptic only; modern English REFERENCE-ONLY | planned |
| `coptic_gospel_thomas` | `/workspace/language-packs/coptic_gospel_thomas/` | **Shared with `../gnostic/` and `../yeshua/`.** Saying 114 (and any other Magdalene notices). Rights-cleared Coptic only; modern NHL English REFERENCE-ONLY | planned |
| `latin_gregory_homily33` | `/workspace/language-packs/latin_gregory_homily33/` | Gregory the Great, *Homilia in Evangelia* 33 (591): the Western conflation of Mary Magdalene, Mary of Bethany, and the Lukan “sinner.” PD Latin (e.g. PL); PD English only if a printing is named | planned |

Possible later packs (not scheduled, not created): `latin_golden_legend_magdalene` for the *Golden Legend* / Provence narrative, from a confirmed-PD Latin or English (Caxton or another pre-1929 printing; modern translations REFERENCE-ONLY). The 1969 calendar revision and the 2016 feast elevation stay in `sources.md` as liturgical documents (usually REFERENCE-ONLY / LINK-ONLY). *Holy Blood, Holy Grail*, *The Da Vinci Code*, and the “Gospel of Jesus’ Wife” are **not** planned as packs (*Holy Blood* and *Da Vinci Code* = modern non-evidence; Jesus’ Wife = forgery).

## App import (when a pack is READY)

Field mapping: `content/language-packs/_templates/app-import-mapping.md`.
Until a `mary-magdalene` collection is added, import sources with
`collectionSlug: ecclesiastical` (canonical, Coptic, Latin patristic and
legend). Pack front matter may still set `case_study: mary-magdalene` and
`collection_slug: mary-magdalene` as the intended future value. Shared
packs keep a single top-level folder; `case_study` in front matter can
name the primary home (`gnostic` or `mary-magdalene`) and the other
index simply links to it.
