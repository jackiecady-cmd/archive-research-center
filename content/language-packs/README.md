# Language packs drop zone (owned by Lexicon)

Translations and language data for the archive center, built to plug into the
research pipeline. Mirrors Archivist's `/workspace/research/` conventions.
Shared alias: `/workspace/shared/language-packs` (symlink to this folder).

## One folder per pack: `/workspace/language-packs/<slug>/`
- `pack.md`     the pack: source text, transliteration, English (plus any other
                target language), reliability score, dialect/variant notes,
                flagged uncertainties, license, and a ready-to-use summary
- `sources.md`  numbered sources matching the pack's [^n] citations, with links
                to primary sources (editions, museum/CDLI numbers, manuscripts)
                and a License / PDF-OK or REFERENCE-ONLY flag on every line
- `raw/`        optional: source scans, transcriptions, lexicon lookups
- `READY`       empty file added only when the pack is final. Archivist,
                Syllabus, and the content bots use only packs that have it.
- `<slug>.pdf`  rendered by Grok Bot after `READY` is present (see below).
                Lexicon does not write the PDF.

Packs always live at this top level. Case-study folders under
`case-studies/` are umbrella indexes only; they do not contain pack folders.

## Slugs
`<language>_<subject>` in lowercase_with_underscores, e.g.
`sumerian_inanna_descent`, `coptic_magical_papyri`, `hebrew_lilith_isaiah34`,
`arabic_jinn_terms`. If a pack supports a research brief, put that brief's
slug in the pack's `brief_slug` field (matches `/workspace/research/<slug>/`
and the `brief_slug` column in `/workspace/syllabus/calendar.csv`).

## Rules every pack follows
- Non-biased: render what the text says, note interpretive traditions
  separately, never smooth over a hard reading.
- Every rendering is cited. Lexicons and editions named, with page or entry.
- Uncertain readings are flagged ⚠️ UNCERTAIN with the reason and what would
  settle it. Broken or restored text is marked as such.
- Reliability is scored with `_templates/reliability-rubric.md`.
- Front matter includes `license: PD | CC-BY | CC-BY-SA | reference-only`.
  Only the first three may go into a PDF. Copyrighted modern editions and
  translations are REFERENCE-ONLY: cite them, do not copy them into PDFs.

## PDFs and the archive index (Grok Bot)

When a pack is `READY`, Grok Bot renders it to

`/workspace/language-packs/<slug>/<slug>.pdf`

and adds a row to `/workspace/shared/archive-index.csv`.

**Cover-page block** (Grok Bot should include all of this on page 1, so a
user can evaluate the PDF without opening the markdown):

- Title, slug, date, author (Lexicon)
- Source language and target language(s)
- License (`PD` / `CC-BY` / `CC-BY-SA`) and a short attribution / share-alike
  notice as the license requires
- Overall reliability score (n/5) and the seven criterion scores
- Witness date and its distance from the date of composition
- One-line takeaway and “do not say as fact” lines from the summary
- Primary edition citation and source URL
- A note that copyrighted comparanda were not included in the PDF

Do not render `reference-only` packs to PDF.

## Import into the Archive & Research Center app

READY packs are written so they can be imported into the app at
`/workspace/projects/archive-research-center` without renaming fields.
Each `### layer: <field>` in `pack.md` is a `translations` column; each
`sources.md` entry carries the `sources` table fields. Mapping, confidence
and availability rules, and existing collection slugs are in
`_templates/app-import-mapping.md`. Do not modify the app to fit a pack;
fit the pack to the schema. `userInterpretation` is left empty for
Jacqueline. `aiAssistance` is disclosed and is never evidence.

## Files here
- `_templates/pack-template.md`       copy into a new pack folder as `pack.md`
                                      (canonical `### layer:` sections for
                                      the translations table)
- `_templates/sources-template.md`    copy as `sources.md` (sources-table fields)
- `_templates/reliability-rubric.md`  scoring criteria (1–5), including license
                                      and witness-distance criteria
- `_templates/app-import-mapping.md`  field-by-field pack → translations/sources
- `languages.md`                      script, transliteration standard, and
                                      reference works per language
- `source-catalog.md`                 open primary-text sources, licenses, and
                                      scrape notes; includes a regional
                                      manuscript/library section (no scrapes
                                      started)
- `github-findings.md`                search for Jacqueline’s GitHub archive
- `planning/community-and-access-plan.md`
                                      rooms, memberships, on-demand
                                      translation, licence-gated PDFs, VIP
                                      comp invitations (planning only)
- `case-studies/`                     umbrella indexes (Yeshua, Hecate,
                                      egregores, antichrist, demonization,
                                      goetia, mesopotamian, egyptian, celtic,
                                      norse, siberian, alpine, slavic,
                                      satan-lucifer, gnostic, mary-magdalene,
                                      judaism, hindu, zoroastrian, basque,
                                      lilith, plus a pantheons index); planned packs
                                      are listed in each `packs.md` and will
                                      be created top-level when work begins
- `_intake/`                          register for Jacqueline’s own books
                                      and grimoires (owned copies: private
                                      research only; PDFs only if PD or
                                      licensed)
