---
title: "<Pack title>"
slug: <language_subject>
date: YYYY-MM-DD
source_language: "<e.g. Sumerian / Sahidic Coptic / Biblical Hebrew / Classical Arabic>"
target_languages: [English]          # add others as needed
brief_slug: <matching /workspace/research slug, or none>
case_study: <yeshua | hecate | none>
collection_slug: <see _templates/app-import-mapping.md>
reliability: <1-5>                   # overall score, see rubric
license: <PD | CC-BY | CC-BY-SA | reference-only>
status: draft                        # draft | final | revised
for: [Archivist, Syllabus, Hooksmith, Reelwright]
author: Lexicon
---

# <Pack title>

**License note:** `PD`, `CC-BY`, and `CC-BY-SA` packs may be rendered to PDF
(credit and share-alike obligations must appear on the cover page).
`reference-only` packs are for internal study and citation; they must not be
placed in a PDF. CC-BY-NC and all-rights-reserved editions are always
`reference-only`.

**Import note:** Layer sections below are named exactly for the Archive &
Research Center `translations` table. A READY pack imports one translations
row per `## passage` block, with each `### layer: <field>` going straight
into that column. See `_templates/app-import-mapping.md`. Do not rename
layer headings.

**Provenance:** AI, model, and provider details belong only in
`provenance.internal.md` in this pack folder. That file is not part of
the public pack and must not appear in a pack PDF. Public attribution
is only for published translations (`publishedTranslationAttribution`).

## Dialect / variant notes
- **Dialect or register:** <e.g. Emesal vs Emegir; Sahidic vs Bohairic; Biblical vs Mishnaic; Classical vs Levantine/Egyptian/Maghrebi>
- **Manuscript variants:** <where witnesses differ and how>
- **Script or orthography notes:** <spelling variants, vocalisation, ligatures>
- **Witness date / distance from original:** <e.g. Old Babylonian tablet; medieval MS of a 5th c. BCE poem; see rubric>

## Uncertainties
> ⚠️ **UNCERTAIN** — <word/line>. Why: <broken text / rare word / scholars disagree / later attribution>. Readings on the table: <A [^n], B [^n]>. What would settle it: <source to check>.

## Reliability score: <n>/5
| Criterion | Score | Note |
|---|---|---|
| Source quality | | |
| Text condition | | |
| Translation confidence | | |
| Scholarly consensus | | |
| Citation completeness | | |
| License / legal status | | |
| Witness date / distance | | |
**Overall:** <n>/5. Reason in one line. (Criteria: `_templates/reliability-rubric.md`. Overall cannot sit more than one point above the lowest criterion.)

## Ready-to-use summary (Archivist / content bots)
- **One-line takeaway:** <plain, sourced>
- **Safe to quote:** <exact English lines cleared for use, with citation>
- **Pronunciation guide:** <approximate, labelled as reconstruction where it is one>
- **Do not say as fact:** <points from Uncertainties>
- **Hand-off notes:** <what Archivist or Syllabus should know>

---

## passage: 1

source_ref: 1
passage_id: <short_id, e.g. theogony_411-452>
label: <human label, e.g. Hesiod, Theogony 411–452>

The `source_ref` number must match an entry in `sources.md`. Each passage
imports as one `translations` row linked to that source. The app stores one
workspace per source: if two passages need separate workspaces, give them
separate `sources.md` numbers (titles may include the line range).

### layer: originalText
<Original-script text of this passage, as it should appear in the Source layer.>

### layer: transliteration
<Phonetic rendering into Latin characters, using the standard in languages.md.>

### layer: morphologyNotes
<Word-by-word grammatical and lexical notes; one entry per line. Cite the lexicon.>

### layer: literalTranslation
<Word-for-word English that preserves the grammar of the original, even if awkward.>

### layer: readableTranslation
<Clear, natural English of the same passage, still faithful to the source. This is Lexicon’s rendering, not a published edition, unless the two coincide under a PD/open licence.>

### layer: publishedTranslation
<Quote a published translation only when it is public domain or openly licensed (PD, CC-BY, CC-BY-SA) and the licence is recorded on the matching sources.md entry as PDF-OK. For reference-only works (Betz, modern Nag Hammadi English, recent Loebs, etc.): leave this layer empty or write a one-line pointer, and put the citation in the attribution layer. Do not quote those works at length.>

### layer: publishedTranslationAttribution
<Full citation for the published translation, or “none used.” For a reference-only translation that was consulted but not quoted: “Consulted, not quoted: <citation>. REFERENCE-ONLY.”>

### layer: commentary
<Contextual, historical, or linguistic notes. Cite sources. Pack-level uncertainties that apply to this passage may be repeated here. Do not put Jacqueline’s personal reading here — that belongs in userInterpretation.>

### layer: userInterpretation
<!-- Leave empty. This layer is for Jacqueline or other users of the app, not for Lexicon. -->

### layer: aiAssistance
<!-- Leave empty in the public pack. Do not disclose AI, model, or provider names here or in any other public layer. Record that provenance in provenance.internal.md, which is excluded from public import and from pack PDFs. Decided 11 November 2026 (t32s2). This layer is never evidence. -->

### view: lineByLine
Optional display only. Not a `translations` column. Keep it in sync with the
canonical layers above; the layers win if the two ever differ.

Conventions: [ ] = broken/restored, ( ) = added for sense, ? = uncertain sign or reading.

| Line | Original script | Transliteration | Literal gloss | English translation |
|---|---|---|---|---|
| 1 | | | | |

---

<!-- Copy the `## passage: N` block for each further passage. Increment
     passage number and set source_ref / passage_id. -->

## Key terms
| Term | Script | Translit. | Meaning(s) | Lexicon reference |
|---|---|---|---|---|
| | | | | [^n] |

## Sources
Numbered entries live in `sources.md`. Short citations may also appear here:

[^1]: <Author, *Title*, publisher/year, page or URL. See sources.md entry 1.>
