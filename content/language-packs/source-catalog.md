# Source catalog: open primary texts

Compiled 10 November 2026 (America/Chicago). Corpus entries were checked
that afternoon; the regional manuscript and library section was added the same
evening (about 7:45–8:00 PM America/Chicago). URLs were requested the same day.
No full scrapes or translations have been started. This is a planning catalog
for legal, licensed conversion of public-domain or openly licensed texts into
pack PDFs. Copyrighted modern editions are listed so they can be used as
**REFERENCE-ONLY** comparanda; they must not go into PDFs.

**PDF rule:** a text may be placed in a pack PDF only when it is public domain,
CC0, CC-BY, or CC-BY-SA (attribution and share-alike honored). CC-BY-NC,
permission-required, and all-rights-reserved works are REFERENCE-ONLY.

**Reliability tier** here is about the *source collection* as a starting point
(how close it stays to primary witnesses and scholarly editions), not a pack
score. Individual packs are still scored with `_templates/reliability-rubric.md`.

**URL check key:** “Live” means HTTP 200 from this environment on 10 November
2026. “Live, TLS trouble here” means the well-known site did not complete TLS
from this box; it is not treated as dead. Dead or 404 URLs were dropped or
replaced. “Live, bot-walled / rate-limited here” means a well-known host
returned 403 or 429 to this environment; it is not treated as dead. “Check”
means the current portal path or the reuse terms were not verified from this
box.

**Contents:** corpus catalogs by language and tradition (this first half of
the file); [manuscript and library repositories by region](#manuscript-and-library-repositories-by-region)
(Europe; Middle East including Levant / Arabia / Persia / Anatolia;
Mesopotamia / Sumer; Egypt / North Africa including Coptic and Ethiopic;
other, including India / Sanskrit, Armenia / Georgia, and Central Asia).

---

## Mesopotamian (Sumerian, Akkadian)

### CDLI — Cuneiform Digital Library Initiative
- **URL:** https://cdli.earth/ — live. Terms: https://cdli.earth/terms-of-use (live).
- **Old URL:** `cdli.ucla.edu` no longer reliable (TLS failure); do not use as
  the canonical address.
- **Languages:** Sumerian, Akkadian, and other cuneiform languages; catalogue
  data, transliterations, some translations, artefact images.
- **Content:** Museum-backed catalogue of cuneiform objects, with photos or
  line art where the holding institution allows, plus text editions.
- **License / terms (verified 2026-11-10 from the terms page):** Images are
  for **non-commercial** student, scholar, and public use; photographs and
  line art remain the property of the holding institutions or named authors.
  Commercial reuse of images needs prior written permission. *Text*
  (transliterations and translations on CDLI pages) “may be freely copied,
  aggregated and re-used according to common and fair academic practice”;
  substantial reuse should credit CDLI and https://cdli.earth.
- **Bulk / API:** https://github.com/cdli-gh (live). Catalogue dumps exist;
  confirm the current dump path on cdli.earth before a harvest. Images are
  not in the same bucket as the reusable text.
- **Reliability tier:** High (primary objects and catalogue).
- **Scrape notes:** Text is the harvestable layer for packs. Do not put CDLI
  images into a public or commercial PDF without institutional permission.
  Credit CDLI on every pack that uses its text.
- **PDF:** Text — generally PDF-OK with attribution, still confirm per object
  if a translator’s rights are reserved. Images — REFERENCE-ONLY / permission
  required.

### ORACC — Open Richly Annotated Cuneiform Corpus
- **URL:** https://oracc.museum.upenn.edu/ — live via HTTPS (this environment
  needed a TLS workaround; the document pages returned 200). Open data:
  https://oracc.museum.upenn.edu/doc/opendata/ (live, CC BY-SA 3.0 stated on
  the page, 2014). GitHub org: https://github.com/oracc (live).
- **`oracc.org`:** TLS did not complete from this environment; do not treat as
  the canonical host.
- **Languages:** Sumerian, Akkadian, and project-specific corpora (royal
  inscriptions, lexical lists, etc.).
- **Content:** Annotated, lemmatised corpora with project-level editions.
  This is often the best structured layer on top of CDLI objects.
- **License:** CC BY-SA 3.0 (verified on the open-data page). Share-alike
  applies to adaptations.
- **Bulk / API:** JSON and project data documented under `/doc/opendata/`;
  sources also on GitHub.
- **Reliability tier:** High.
- **Scrape notes:** Prefer project JSON/Git over HTML scraping. Honor
  CC BY-SA on any pack PDF (license `CC-BY-SA`). ETCSRI and other ORACC
  projects are not a substitute for ETCSL (below).
- **PDF:** PDF-OK as CC-BY-SA, with attribution.

### ETCSL — Electronic Text Corpus of Sumerian Literature (Oxford)
- **URL:** https://etcsl.orinst.ox.ac.uk/ — live. Credits and copyright:
  https://etcsl.orinst.ox.ac.uk/credits.htm and
  https://etcsl.orinst.ox.ac.uk/edition2/credits.php (both live).
- **Languages:** Sumerian (composite transliteration) with English prose
  translations. Includes Inana’s Descent (catalogue 1.4.1) and related
  literary texts.
- **Content:** Near-standard composite texts and translations for Ur III /
  Old Babylonian Sumerian literature, now frozen (funding ended 2006).
- **License / terms (verified from the credits pages):** Copyright remains
  with the named editors (Black, Cunningham, Robson, Zólyomi, and later
  collaborators), 1998–2006, moral rights asserted. Oxford / Faculty of
  Oriental Studies copyright notice on the site. **No Creative Commons
  licence is offered.** Citation form is given; permission is not.
- **Bulk / API:** The site describes a corpus download on its navigation-help
  page; there is no open licence attached to that download. Do not bulk-copy
  into PDFs without written permission from the rights holders.
- **Reliability tier:** High as a scholarly composite, but not a substitute
  for tablet witnesses (use CDLI / ORACC alongside it).
- **Scrape notes:** Use on the site and cite it. Treat ETCSL wording
  (transliteration *and* English) as **REFERENCE-ONLY** until permission is
  in hand. For an Inanna pack, start from CDLI witnesses and independent
  PD or CC editions, and log ETCSL as the standard composite to check
  against.
- **PDF:** REFERENCE-ONLY until written permission is received.

---

## Egyptian and Coptic

### Thesaurus Linguae Aegyptiae (TLA)
- **URL (current):** https://thesaurus-linguae-aegyptiae.de/ — live. License
  page exists at https://thesaurus-linguae-aegyptiae.de/info/licenses (HTTP
  200) but was bot-walled from this environment, so the exact licence text
  was **not verified** today. Older interface: https://aaew.bbaw.de/tla/
  (live).
- **Languages:** Ancient Egyptian (hieroglyphic, hieratic, demotic), with
  German/English lemmas; some Coptic-related material via the wider BBAW
  ecosystem.
- **Content:** Word-level corpus and dictionary of the BBAW Wörterbuch
  project; sentences and lemmas tied to sources.
- **License:** Re-check `/info/licenses` in a browser before any harvest.
  Do not assume CC.
- **Bulk / API:** Confirm on the new site; do not scrape the login-walled
  old servlet as a bulk source.
- **Reliability tier:** High.
- **Scrape notes:** Browser-verified licence first. Bot-protection is
  active; a polite, documented dump or official export is preferable to
  HTML scraping.
- **PDF:** Not cleared until the licence page is read.

### Coptic Scriptorium
- **URL:** https://copticscriptorium.org/ — live. Corpora GitHub:
  https://github.com/CopticScriptorium/corpora (live). Search/browse:
  http://data.copticscriptorium.org. Releases also on Zenodo (DOI from the
  repo README, v6.2.0+).
- **Languages:** Coptic, especially Sahidic; some aligned English.
- **Content:** Annotated corpora (CoNLL-U, TEI, PAULA, relANNIS), including
  biblical, monastic, and other literary texts. Quality flagged per document
  (automatic / checked / gold).
- **License:** No single top-level LICENSE file in the corpora repo (checked
  2026-11-10). Project materials are generally open (commonly CC-BY, with
  some documents CC-BY-SA). The Sahidica New Testament is reported to carry
  a **special licence** — verify per document before a PDF. Do not assume
  one licence for the whole tree.
- **Bulk / API:** GitHub clone of the corpora repo; ANNIS for query; Zenodo
  snapshots.
- **Reliability tier:** High (especially gold / checked documents).
- **Scrape notes:** Prefer the GitHub/Zenodo release over crawling the
  website. Read each document’s header for licence. Treat Sahidica-derived
  files as uncleared until their terms are copied into the pack.
- **PDF:** Per document. Default to REFERENCE-ONLY if the header is missing
  or is Sahidica-special.

### Coptic Dictionary Online
- **URL:** https://coptic-dictionary.org/ — live. About:
  https://coptic-dictionary.org/about.cgi (live; the about page is thin
  without JS). KELLIA collaboration with Coptic Scriptorium. Built on Crum
  and later lexicography.
- **Languages:** Coptic (lemmas, dialects noted).
- **Content:** Digital lexicon, not a text corpus. Essential reference for
  Coptic packs.
- **License:** Not clearly readable from the static about page today.
  Crum, *A Coptic Dictionary* (Oxford, 1939): public-domain status is
  **jurisdiction-dependent** (Crum died 1944; UK generally PD; US
  publication-renewal status needs a per-title check). Until CDO’s own
  terms are confirmed, treat the *site’s compiled entries* as
  REFERENCE-ONLY and cite Crum by page for packs.
- **Bulk / API:** Check the site / KELLIA docs; do not scrape if an official
  data dump exists.
- **Reliability tier:** High as a lexicon.
- **PDF:** Lexicon *citations* are fine; do not dump dictionary entries into
  a PDF until terms are confirmed. Crum itself: verify US status before
  quoting at length.

---

## Greek and Latin

### Perseus Digital Library / Scaife
- **URL:** https://www.perseus.tufts.edu/hopper/ — live. Scaife:
  https://scaife.perseus.org/ — live. Org: https://github.com/PerseusDL —
  live. Perseus copyright help page
  (`/hopper/help/copyright.jsp`) returned 403 to this client (browser
  sniff); terms must be re-checked in a browser, per work.
- **Languages:** Ancient Greek, Latin, and other Perseus collections, with
  older English translations.
- **Content:** Classical texts with morphology tools; Scaife is the modern
  CTS reader and aggregates First1KGreek and other Open Greek and Latin
  texts as well as Perseus.
- **License:** Mixed, **per work**. Many source editions are PD; many
  English translations on Perseus are older Loeb or public-domain versions,
  but later Loebs and some annotations remain in copyright. Do not treat
  “it is on Perseus” as a licence.
- **Bulk / API:** PerseusDL GitHub; CTS / Scaife; catalog at
  http://catalog.perseus.org.
- **Reliability tier:** High for Greek/Latin text when the edition is named;
  translations vary.
- **Scrape notes:** Prefer named PD editions (for example Evelyn-White 1914
  for Hesiod and the Homeric Hymns, also on Wikisource / Internet Archive)
  for pack PDFs. Log the exact CTS URN and edition.
- **PDF:** Only after the individual work’s rights are confirmed. Evelyn-White
  1914 and other pre-1929 US publications: PDF-OK (US PD).

### Open Greek and Latin / First1KGreek
- **URL:** https://www.opengreekandlatin.org/ — live (redirects from
  opengreekandlatin.org). Texts: https://github.com/OpenGreekAndLatin/First1KGreek
  — live. Catalogue: https://opengreekandlatin.github.io/First1KGreek/ — live.
  `first1k.info` did not complete TLS here; use the GitHub Pages catalogue.
- **Languages:** Greek (and some Latin / modern language files) from Homer
  through roughly 250 CE, aiming to cover works not already in Perseus.
- **Content:** TEI XML editions, readable in Scaife.
- **License:** No top-level LICENSE file in the repo (checked 2026-11-10).
  Licence is per TEI header. Many files encode public-domain printed
  editions; OGL practice is open reuse with attribution, often CC BY-SA,
  but **read the header**.
- **Bulk / API:** Git clone; Scaife; Zenodo DOI 10.5281/zenodo.596723
  (from the README).
- **Reliability tier:** High when the print edition is a standard text.
- **Scrape notes:** Harvest via git, not HTML. Record the CTS URN and the
  header’s licence in `sources.md`.
- **PDF:** Per file, after the TEI header is copied into the pack.

### Papyri.info (Duke / papyrological navigator)
- **URL:** https://papyri.info/ — live. Licence page:
  https://papyri.info/docs/license (HTTP 200, but bot-walled today; text
  not captured). Also relevant for Greek (and Demotic) magical and
  documentary papyri as a complement to Preisendanz.
- **License:** Officially documented on that page — re-read in a browser
  before a scrape. Do not assume CC.
- **Reliability tier:** High for documentary papyri.
- **PDF:** Not cleared until the licence page is read.

### The Latin Library
- **URL:** https://www.thelatinlibrary.com/ — live. About:
  https://www.thelatinlibrary.com/about.html — live.
- **Languages:** Latin.
- **Content:** Convenient plain-text collection, no consistent critical
  apparatus, no formal open-licence statement comparable to OGL. Useful as
  a finding aid only.
- **Reliability tier:** Low–medium (uncritical texts).
- **Scrape notes:** Do not use as the base text of a pack PDF. Prefer
  Perseus / Open Greek and Latin / a named PD edition.
- **PDF:** Not a PDF source.

### Preisendanz, *Papyri Graecae Magicae*, vols. 1–2 (1928, 1931)
- **What it is:** The standard Greek (and some Coptic/Demotic-adjacent)
  edition of the Greek Magical Papyri, with German translation. Essential
  for the Hecate / Hecate-Selene PGM hymns.
- **US status:** Vol. 1 (1928) entered the US public domain on 1 January
  2024. Vol. 2 (1931) enters the US public domain on 1 January 2027. Until
  then, vol. 2 is REFERENCE-ONLY for US PDFs.
- **EU/UK status:** Karl Preisendanz died 1968; protection generally runs
  to the end of 2038. Flag this ⚠️ on any pack that uses even vol. 1, so
  the PDF is not redistributed as PD outside the US.
- **Later recensions:** The Henrichs second edition (Teubner, 1973–74) is
  in copyright everywhere — REFERENCE-ONLY.
- **Betz, *The Greek Magical Papyri in Translation*** (University of
  Chicago Press, 1986/1992): in copyright. **REFERENCE-ONLY. Do not copy
  Betz’s English into a pack, a PDF, or a ready-to-use quote.** It may be
  cited as a scholarly translation to check against.
- **Where to look:** Internet Archive and major library scans of the 1928
  volume; confirm the scan is the 1928 printing, not a later recension.
  Papyri.info and museum pages for individual papyri (e.g. PGM IV,
  Bibliothèque nationale).
- **PDF:** Vol. 1 Greek (and Preisendanz’s 1928 German, US only): PDF-OK
  with the EU/UK warning. Vol. 2, Henrichs, Betz: REFERENCE-ONLY.

---

## Hebrew, Aramaic, Syriac, and the Bible

### Open Scriptures Hebrew Bible / Westminster Leningrad Codex
- **URL:** https://github.com/openscriptures/morphhb — live.
  Project page: http://openscriptures.github.io/morphhb/
- **Languages:** Biblical Hebrew (and some Aramaic portions of the HB),
  WLC text with lemma and morphology.
- **License (verified from README and LICENSE.md):** The **WLC text is
  public domain**. Lemma and morphology data are **CC BY 4.0**, attribution:
  “Original work of the Open Scriptures Hebrew Bible available at
  https://github.com/openscriptures/morphhb”.
- **Bulk / API:** Git clone; OSIS XML in `wlc/`.
- **Reliability tier:** High (diplomatic WLC plus ongoing morphology).
- **Scrape notes:** Ideal base for `hebrew_aramaic_yeshua_name` and
  `hebrew_lilith_isaiah34`. If the pack uses morphology, license the pack
  CC-BY and attribute OSHB; if it uses only the WLC consonants/vowels,
  `PD` is enough.
- **PDF:** PDF-OK (PD text; CC-BY if morphology is included).

### SBLGNT — SBL Greek New Testament
- **URL:** https://sblgnt.com/license/ — live, CC BY 4.0. GitHub (repo moved):
  https://github.com/Faithlife/SBLGNT (live; `LogosBible/SBLGNT` redirects
  here). README confirms CC BY 4.0; © 2010 Society of Biblical Literature
  and Logos Bible Software.
- **Languages:** Koine Greek (critical NT edition, Holmes).
- **Bulk / API:** Git clone of the Faithlife repo.
- **Reliability tier:** High (modern critical edition).
- **Scrape notes:** Attribute SBL and Faithlife/Logos as the licence
  requires. Good base for `greek_yeshua_nt_koine`.
- **PDF:** PDF-OK as CC-BY.

### Sefaria
- **URL:** https://www.sefaria.org/ — live. Terms:
  https://www.sefaria.org/terms — live (JS-heavy). Export:
  https://github.com/Sefaria/Sefaria-Export — live. Bulk data in a public
  GCS bucket (`gs://sefaria-export/`), no auth required, documented in that
  repo.
- **Languages:** Hebrew, Aramaic, English and other translations, rabbinic
  and later Jewish texts (including material relevant to Lilith, such as
  *Alphabet of Ben Sira*, where present).
- **License (from Sefaria-Export LICENSE.md, verified):** **Per text**,
  recorded in each JSON `license` field. Typically Public Domain, CC0,
  CC-BY, CC-BY-SA, or **CC-BY-NC**. There is no single corpus licence.
- **Reliability tier:** Medium–high; quality and licence vary by text.
  Always name the underlying edition, not only “Sefaria.”
- **Scrape notes:** Use the export bucket, not HTML scraping. Read the
  `license` field before any PDF. CC-BY-NC items are REFERENCE-ONLY for
  PDFs under the archive rule above. English translations on Sefaria are
  often still in copyright even when the Hebrew is PD.
- **PDF:** Only texts whose export `license` is PD, CC0, CC-BY, or CC-BY-SA.

### Codex Sinaiticus project
- **Canonical site:** https://www.codexsinaiticus.org/ and
  https://codexsinaiticus.org/ — TLS did not complete from this environment
  on 10 November 2026 (connection reset). **Not confirmed dead.** The
  British Library item URL used here redirected to a generic BL stories
  page; a current BL viewer link should be confirmed in a browser.
- **Content:** Fourth-century Greek Bible codex (NT complete, much of the
  OT/LXX and some extras), with transcription and images from the
  holding institutions (British Library, Leipzig, St Catherine’s, National
  Library of Russia).
- **License:** Image and transcription rights are institutional; historically
  the project allowed non-commercial use of images with credit. **Re-verify
  on the live viewer before any PDF use of images.** The underlying
  fourth-century text of the Bible is not under copyright; the project’s
  transcription and photographs may be.
- **Reliability tier:** High as a witness (not as a critical edition by
  itself).
- **Scrape notes:** Excellent witness note for `greek_yeshua_nt_koine`. Do
  not bulk-download images until terms are confirmed. Transcription: check
  the project terms.
- **PDF:** Text of scripture itself may be quoted from a cleared edition
  (e.g. SBLGNT) with Sinaiticus cited as a witness. Project images:
  uncleared until terms are read.

### CCEL — Christian Classics Ethereal Library
- **URL:** https://www.ccel.org/ — live. Older copyright-help URLs
  (`/copyprotect.html`, `/info/copyright`, `/ccel/about`) are 404; use the
  site’s current about/terms and the page for each work.
- **Languages:** English translations and some original-language texts,
  patristic and later Christian literature.
- **License:** Mixed. Many works are PD translations (Schaff, ANF/NPNF,
  etc.); some pages or recent material may not be. Check each work.
- **Reliability tier:** Medium (often older scholarship; still useful when
  the print edition is named).
- **PDF:** Per work, PD only.

### Peshitta / Syriac (for the Yeshua case study)
- Not a single official open corpus. Candidates, to be reviewed: Beth
  Mardutho / SEDRA; Dukhrana; older print editions and English translations
  that are PD in the US (for example James Murdock, 1851). George Lamsa’s
  translation is in copyright — REFERENCE-ONLY.
- **PDF:** Only a named PD edition of the Syriac and/or a PD English.

---

## Arabic / Qur’an

### Tanzil
- **URL:** https://tanzil.net/ — live. Text licence:
  https://tanzil.net/docs/text_license — live (the older
  `/docs/copyright` path is a missing-page stub; do not use it).
- **Languages:** Arabic Qur’an text (highly verified orthographies);
  translations are a separate, mixed-rights layer.
- **License (verified):** © 2007–2021 Tanzil Project, **CC BY 3.0**, with
  an extra restriction stated on the licence page: verbatim copies may be
  distributed, **“CHANGING IT IS NOT ALLOWED.”** Source credit and a link
  to tanzil.net are required, and the notice must travel with substantial
  copies.
- **Bulk / API:** https://tanzil.net/download/ — official download. Do not
  scrape the reader.
- **Reliability tier:** High for the Arabic text.
- **Scrape notes:** Use the official download. Do not normalise or “fix”
  the Arabic if that would violate the no-change term. Translations on
  Tanzil must be licensed separately; many are not PD.
- **PDF:** Arabic text: PDF-OK as CC-BY, with the no-change notice on the
  cover. Translations: per work.

### Corpus Coranicum (BBAW)
- **URL:** https://corpuscoranicum.de/en — live (the bare
  `https://corpuscoranicum.de/` returned 500 here; use the `/en` path).
- **Languages:** Arabic Qur’an, early manuscripts, commentary, variants.
- **License:** Not captured today (the site is live; terms need a browser
  pass, including manuscript-image rights).
- **Reliability tier:** High.
- **Scrape notes:** Licence and image rights first. Likely a REFERENCE
  environment more than a PDF dump source.
- **PDF:** Not cleared.

---

## General / mixed corpora

### Internet Archive
- **URL:** https://archive.org/ — live. Terms:
  https://archive.org/about/terms — live.
- **Content:** Scans of printed books, including many PD editions relevant
  here (Budge; Evelyn-White 1914; older PGM, hymn, and biblical editions).
  Rights are **per item**, shown on the item page.
- **License:** IA hosting is not a licence. Use only items whose item-page
  rights statement is PD, CC0, CC-BY, or CC-BY-SA, and whose publication
  date supports that claim. A community upload marked “PD” can still be
  wrong — check the title-page date and the author’s death date.
- **Bulk / API:** Official IA API / `ia` CLI; stay within robots and rate
  limits. No full harvest of IA is planned.
- **Reliability tier:** Varies; the scan is only as good as the edition.
- **Scrape notes:** Prefer library-digitised copies (BL, BNF, Wellcome,
  university partners) over anonymous uploads when both exist.
- **PDF:** Per item. Useful PD targets: Evelyn-White 1914; Preisendanz 1928
  vol. 1 (US); many pre-1929 English translations.

### Wikisource
- **URL:** https://en.wikisource.org/ — live. Other language domains as
  needed (Greek, Latin, Hebrew, German, French).
- **License:** Site default is typically CC BY-SA 4.0; Wikisource also
  hosts public-domain works. Check the page licence and the edition
  used. Transcription errors occur; collate against a scan.
- **Reliability tier:** Medium (user-transcribed).
- **PDF:** PD or CC-BY-SA pages, after a check against the printed edition.
  Good fallback for Evelyn-White, Taylor’s Orphic Hymns (1792), Whiston’s
  Josephus, Church/Brodribb’s Tacitus, and similar.

### Internet Sacred Text Archive (sacred-texts.com)
- **URL:** https://sacred-texts.com/ (and www.) — live. Terms:
  https://sacred-texts.com/terms-of-service — live (the old `/tos.htm`
  redirects here).
- **Terms (verified in part from the TOS):** Texts are *believed* by the
  site to be US public domain or redistributable for non-commercial use;
  ISTA-produced pages and site arrangement have their own rules;
  electronic copies of ISTA-produced PD texts for non-commercial use
  require the attribution notice and a link back; you may not claim a new
  copyright on them. Some material (e.g. parts of the Internet Book of
  Shadows) remains in copyright and is posted only by permission, often
  non-commercially.
- **Reliability tier:** Low–medium. Convenient, unevenly sourced, sometimes
  uncritical or outdated translations. Fine as a finding aid, not as a
  base edition.
- **Scrape notes:** **Do not bulk-scrape the site** as a corpus. For any
  text that matters, go to the named print edition (often on IA or
  Wikisource) and cite that. Be especially careful with occult / esoteric
  sections: “it is on sacred-texts” is not evidence of licence or of
  scholarly quality.
- **PDF:** Only when the underlying print edition is independently
  confirmed PD/CC and is cited instead of (or in addition to) the ISTA
  page. ISTA HTML should not be the PDF source.

### Nag Hammadi
- **www.gnosis.org/naghamm/nhl.html:** TLS presented a self-signed
  certificate from this environment (page retrieved only with a workaround).
  Treat as a popular mirror, not a rights-cleared source. Modern
  translations presented there (Robinson *NHL*, Meyer, Pagels excerpts,
  etc.) are **in copyright — REFERENCE-ONLY.**
- **https://www.naghammadi.org/:** live, 200. A separate modern site; not
  treated here as an official rights source. Review before any use.
- **What is actually open:** The fourth-century Coptic *wording* is not
  under copyright. Photographs of Codex II (Gospel of Thomas, etc.) and
  modern critical editions and translations (Robinson, Layton, Meyer,
  Lambdin, etc.) **are**. A pack may discuss and, where a PD transcription
  or a self-made diplomatic transcription from a rights-cleared image
  exists, present the Coptic. It may not paste a modern English NHL
  translation into a PDF.
- **Reliability tier:** The manuscripts themselves are primary; the popular
  websites are not.
- **PDF:** Coptic text only if the transcription’s rights are clear.
  Modern English translations: REFERENCE-ONLY.

### Budge and other older Egyptological / Coptic prints
- E. A. Wallis Budge (d. 1934): many pre-1929 titles are US PD; later
  titles need a date check. Quality is often outdated; use as a historical
  translation, not as the last word, and prefer a better PD or CC edition
  when one exists. Internet Archive has many scans.
- **PDF:** Per title, after a date check.

---

## Manuscript and library repositories, by region

Added 10 November 2026, about 7:45–8:00 PM America/Chicago. Breadth over
depth: this is a starting map so Jacqueline can expand later. Each row keeps
the same **License**, **PDF**, and access fields used in the corpus half of
this file.

**PDF column:** `PDF-OK` — public domain, CC0, CC-BY, or CC-BY-SA (attribution
and share-alike honored); `LINK-ONLY` — view or cite at the source, do not
put the holder’s images or restricted text in a pack PDF; `REFERENCE-ONLY` —
copyrighted or not cleared for reuse; `mixed` — decide per item; `check` —
terms not verified from this box. CC-BY-NC is treated as REFERENCE-ONLY
unless distribution is confirmed non-commercial.

A 403 or 429 from this environment is recorded as bot-walled or rate-limited,
not as a dead link. TLS or connection errors on well-known hosts are marked
`check` and are not treated as dead.

Corpus projects already described above (CDLI, ORACC, ETCSL, TLA, Coptic
Scriptorium, papyri.info, Perseus, SBLGNT, OSHB, Corpus Coranicum, Tanzil,
and others) are cross-referenced rather than rewritten.

### Vatican Apostolic Library and Apostolic Archive (cross-cutting)

The Archive & Research Center app’s “Vatican connection” is **seed metadata
only**, not a live integration and not a partnership. Seed repository slug
`vatican-apostolic-library` (url https://www.vaticanlibrary.va/, live) and
three sample sources (Vat.lat.1 digitized, Vat.lat.15321 catalog_only,
Barb.lat.4351 restricted). The API serves those database rows. There is no
IIIF client, no vatlib fetch, and no official relationship. **Do not claim an
official Vatican partnership.**

| Name | URL | License / terms | PDF | Notes |
|---|---|---|---|---|
| DigiVatLib | https://digi.vatlib.it/ (live); about: https://digi.vatlib.it/about (live) | Viewer footer (quoted from DigiVatLib item pages): “Free use of this image is only for personal use or study purposes. Rights must be requested for any use in printed or online publications.” | LINK-ONLY for images | Free to consult digitized collections. IIIF Presentation manifest pattern `https://digi.vatlib.it/iiif/{object-id}/manifest.json`. Confirmed live 10 Nov 2026: https://digi.vatlib.it/iiif/MSS_Vat.lat.1/manifest.json (also used for e.g. MSS_Vat.gr.1209). A viewer may display a manifest if BAV personal/study terms allow on-screen use; do not harvest images into pack PDFs. |
| BAV OPAC | https://opac.vatlib.it/ (live) | Catalogue; no reuse of records assumed | LINK-ONLY | Use to identify shelf marks, then open DigiVatLib when a digitization exists. |
| BAV reproductions and rights | https://www.vaticanlibrary.va/en/information-for-readers/photographic-reproductions.html (live); office: https://www.vaticanlibrary.va/en/the-library/reproductions-and-rights-office.html (live) | Digitized MSS and incunabula are offered online as watermarked JPGs. Personal/study use is not a publication licence. Professional, high-resolution, music, exhibition, film, or multimedia use needs prior approval by email to rights@vatlib.it. Contact named on the page: Dr Ilaria Ciolli, tel. +39/06698.79455 (office hours Mon–Fri 8:45–12:00 and Mon/Thu 15:00–17:00). Professional-licence conditions (quoted in substance from the professional-use information): materials are not for sale and cannot be given to third parties; credits must include the complete shelf mark, “© [year] Biblioteca Apostolica Vaticana,” and “by permission of Biblioteca Apostolica Vaticana, with all rights reserved”; electronic publication must impede copying (watermarking); website access must be without charge; licences are time-limited; “Under no circumstances will downloading of the images be allowed.” The Italian text is official for signed licences. | LINK-ONLY unless a formal rights licence is granted in writing | Formal request path: rights@vatlib.it / the professional-use form. Never put BAV images in pack PDFs without that licence. |
| mss.vatlib.it | https://mss.vatlib.it/ — connection failed from this box | check | LINK-ONLY | Do not treat as dead; recheck the current manuscripts portal path. |
| Vatican Apostolic Archive (AAV, formerly Secret Archive) | https://www.archivioapostolicovaticano.va/ (live, redirects to the Italian portal); access rules: https://www.archivioapostolicovaticano.va/content/aav/en/consultazione/accesso-e-consultazione.html (live) | In-person scholarly access, not a public digital library. Research is free for qualified scholars (MA or equivalent; clergy licentiate or PhD), with an admission card and letter of introduction. Documents are open through the end of the pontificate of Pius XII (October 1958). No cameras or scanners in the reading rooms; photography of indexes is not allowed; some CD/DVD digital reproductions are on-site only. | LINK-ONLY / reference for access rules | The app does not mention the Apostolic Archive. In Codice Ratio is a research HTR project, not a public AAV portal. |

**Plain verdict:** link out to DigiVatLib and the OPAC; IIIF can feed a viewer for digitized items under personal/study terms; do not republish BAV images in PDFs without a written licence from rights@vatlib.it; do not claim an official partnership.

### Europe

National libraries, manuscript portals, and museums with open or mixed
collections. Rights almost always vary by item.

| Name | URL | License / terms | PDF | Notes |
|---|---|---|---|---|
| British Library | https://www.bl.uk/ (live). Older path https://www.bl.uk/manuscripts/ returned 404. https://manuscripts.bl.uk/ did not complete from this box. | check (item-level; BL images are not assumed reusable) | LINK-ONLY until a record’s statement is read | Digitised-manuscripts service was disrupted after the 2023 cyberattack; current viewer path is **check**. Catalogue redirects from older `/catalogues/` URLs. Do not treat BL images as PDF-OK. |
| Bodleian Digital | https://digital.bodleian.ox.ac.uk/ (live); terms: https://digital.bodleian.ox.ac.uk/terms/ (live); IIIF: https://iiif.bodleian.ox.ac.uk/ (live) | mixed; often CC-BY-NC for images — **check** per object | mixed / often LINK-ONLY or REFERENCE-ONLY (NC) | Strong medieval, Oriental, and genizah holdings. Confirm the record licence before any PDF use. |
| Gallica / BnF | https://gallica.bnf.fr/ — live, bot-walled here (403). https://www.bnf.fr/ (live). | mixed; many pre-20th-c prints are PD; images and metadata have BnF reuse rules — **check** per item | mixed | Essential for French, Occitan, Latin, and Oriental manuscripts (including Fonds Pelliot). Do not bulk-harvest; follow Gallica terms. |
| e-codices (Swiss manuscripts) | https://www.e-codices.unifr.ch/en and https://e-codices.ch/en (both live) | check (commonly a CC licence on images; confirm per manuscript) | check | High-quality IIIF medieval and early-modern Swiss collections. |
| Biblissima | https://projet.biblissima.fr/ and https://portail.biblissima.fr/ (both live) | aggregator; rights follow the holding institution — **check** | mixed / LINK-ONLY | Discovery layer across French (and partner) manuscript data; not a licence of its own. |
| Cambridge University Digital Library (CUDL) | https://cudl.lib.cam.ac.uk/ (live); Genizah collection: https://cudl.lib.cam.ac.uk/collections/genizah (live) | mixed — **check** per item | mixed | Includes Cairo Genizah, Greek, and Asian manuscripts. |
| Bayerische Staatsbibliothek / MDZ | https://www.digitale-sammlungen.de/en (live); catalogue https://opacplus.bsb-muenchen.de/ (live); https://www.bsb-muenchen.de/ (live) | mixed; many images CC BY-NC-SA or PD — **check** | mixed / NC often REFERENCE-ONLY | Major European manuscript and early-print corpus. |
| Staatsbibliothek zu Berlin | https://digital.staatsbibliothek-berlin.de/ (live); library: https://staatsbibliothek-berlin.de/en/ (live) | mixed — **check** | mixed | Oriental, Hebrew, and European manuscripts; IIIF available on many objects. |
| Universitätsbibliothek Heidelberg, digi | https://digi.ub.uni-heidelberg.de/ (live; lands on the HELIOS digilit page) | mixed — **check** | mixed | Strong medieval and occult-adjacent early prints; confirm each record. |
| Austrian National Library (ONB) | https://www.onb.ac.at/ (live); https://onb.digital/ (live); https://digital.onb.ac.at/ redirects to the main site | mixed — **check** | mixed | Papyrus, music, and manuscript collections. |
| Biblioteca Nacional de España | https://www.bne.es/ and Biblioteca Digital Hispánica — bot-walled here (403) | mixed — **check** | mixed | Keep as a starting national library; recheck BDH in a browser. |
| Biblioteca Nacional de Portugal | https://www.bnportugal.gov.pt/ (live); English: https://www.bnportugal.gov.pt/index.php?lang=en (live). purl.pt returned 500 here. | mixed — **check** | mixed | National library and digital library (purls **check**). |
| KB National Library of the Netherlands | https://www.kb.nl/ and https://www.kb.nl/en (live) | mixed — **check** | mixed | Also DBNL https://www.dbnl.org/ (live) for historical Dutch texts (licence per work). |
| National Library of Sweden | https://www.kb.se/ and https://www.kb.se/in-english.html (live) | mixed — **check** | mixed | Manuscripts and early prints; confirm digital-collection terms. |
| National Library of Scotland | https://www.nls.uk/ (live); https://digital.nls.uk/ returned 405 here | mixed — **check** | mixed | Digital collections path **check**. |
| KBR (Royal Library of Belgium) | https://www.kbr.be/en/ (live); https://opac.kbr.be/ (live) | mixed — **check** | mixed | National library of Belgium. |
| National Library of Norway | https://www.nb.no/ and https://www.nb.no/en/ (live) | mixed — **check** | mixed | Digital bokhylle / manuscript access is often geo- or account-limited; confirm before reuse. |
| Polona (National Library of Poland) | https://polona.pl/ and https://polona.pl/en (live) | mixed — **check** | mixed | Large digitised book and manuscript set. Companion: https://www.bn.org.pl/en (live). |
| National Széchényi Library / MEK | https://oszk.hu/en (live); https://mek.oszk.hu/ (live) | mixed — **check** | mixed | Hungarian national library and electronic library. |
| National and University Library, Zagreb | https://nsk.hr/en/ (live) | mixed — **check** | mixed | Croatian national library. |
| National Library of Finland | https://www.kansalliskirjasto.fi/en (live); https://digi.kansalliskirjasto.fi/ (live) | mixed — **check** | mixed | Digi portal for newspapers, prints, and some manuscripts. |
| Royal Danish Library | https://www.kb.dk/ and https://www.kb.dk/en (live) | mixed — **check** | mixed | National collections; terms **check**. |
| National Library of Latvia | https://lnb.lv/en/ (live) | mixed — **check** | mixed | Starting national-library entry. |
| Martynas Mažvydas National Library of Lithuania | https://www.lnb.lt/ and https://www.lnb.lt/en (live) | mixed — **check** | mixed | Starting national-library entry. |
| National Library of Ireland | https://www.nli.ie/ (live). `/en` returned 404; catalogue was 403 here. | mixed — **check** | mixed | Manuscripts of Irish and European interest. |
| Trinity College Dublin, Digital Collections | https://digitalcollections.tcd.ie/ (live) | mixed — **check** | mixed | Includes early Irish and Western manuscripts; Book of Kells and similar items are usually LINK-ONLY. |
| e-manuscripta.ch / e-rara.ch | https://www.e-manuscripta.ch/ and https://www.e-rara.ch/ (live) | mixed — **check** | mixed | Swiss manuscript and rare-book portals (with e-codices). |
| Manuscriptorium | https://www.manuscriptorium.com/en (live) | aggregator / mixed — **check** | mixed / LINK-ONLY | Central European manuscript aggregation. |
| Handschriftenportal | https://handschriftenportal.de/ (live; successor to manuscripta-mediaevalia.de) | catalogue; rights follow holders — **check** | LINK-ONLY | German manuscript catalogue successor. |
| Monasterium.net | https://www.monasterium.net/mom/home (live; the bare host now points at ICARUS) | mixed — **check** | mixed / LINK-ONLY | Medieval charters; licence per archive. |
| Europeana | https://www.europeana.eu/ — live, bot-walled here (403) | aggregator; rights statements are per item (CC0, CC, rights reserved, etc.) — **check** | mixed | Discovery only; never assume a Europeana hit is PDF-OK. |
| HathiTrust | https://www.hathitrust.org/ — live, bot-walled here (403) | PD full view for many volumes; download and API access vary — **check** | mixed; PD text only when HT and copyright status both allow | Prefer a named PD edition (IA, Wikisource, a national library) when one exists. |
| Library of Congress / World Digital Library | https://www.loc.gov/ (live); WDL now at https://www.loc.gov/collections/world-digital-library/ (live). www.wdl.org redirects here. Catalogue: https://catalog.loc.gov/ (live). | mixed; many rights statements — **check** | mixed | Also LoC Persian rare materials: https://www.loc.gov/collections/persian-language-rare-materials/ (live). |
| OPenn (University of Pennsylvania) | https://openn.library.upenn.edu/ (live) | often PD or CC0, stated on each record — **check** the record | PDF-OK when the record is PD/CC0/CC-BY/CC-BY-SA | Preferred US manuscript image source when the record is open. |
| NYPL Digital Collections | https://digitalcollections.nypl.org/ (live) | mixed — **check** | mixed | Prints, photos, and some manuscripts. |
| Wellcome Collection | https://wellcomecollection.org/ (live). An older “open access and our content” path returned 404. | often CC-BY or CC-BY-NC — **check** per work | mixed | Strong history-of-medicine and some magical/alchemical holdings. |
| Chester Beatty, Dublin | https://chesterbeatty.ie/ and https://chesterbeatty.ie/explore/ (live) | check | LINK-ONLY until terms are read | Biblical papyri, Islamic, and East Asian manuscripts. |
| Morgan Library & Museum | https://www.themorgan.org/ — live, bot-walled here (403) | check | LINK-ONLY until terms are read | Major medieval and literary manuscripts. |
| British Museum collection | https://www.britishmuseum.org/ and `/collection` — live, bot-walled here (403) | commonly CC BY-NC-SA for collection images — **check** (terms page was 403 here) | REFERENCE-ONLY / LINK-ONLY for images if NC is confirmed | Object records for cuneiform, Egypt, Greece, and the Middle East. Text of older museum publications may be PD; images are a separate rights layer. |
| Musée du Louvre / collections | https://www.louvre.fr/en (live); https://collections.louvre.fr/en/ (live) | often all-rights or RMN; some open content — **check** per object | LINK-ONLY until a record is cleared | Near Eastern, Egyptian, Greek, and Islamic collections. |
| The Met Open Access | Open Access policy page and collection search were rate-limited (429) here. Image service https://images.metmuseum.org/ (live). Policy is the well-known CC0 Open Access programme. | CC0 for designated Open Access objects (confirm the object page) | PDF-OK for confirmed OA/CC0 objects, with the Met’s requested credit | Prefer the object’s Open Access badge over a general assumption. |
| V&A collections | https://www.vam.ac.uk/collections (live; older collections.vam.ac.uk redirects) | mixed — **check** | mixed / often LINK-ONLY | Decorative arts and some manuscripts. |
| Rijksmuseum van Oudheden (Leiden) | https://www.rmo.nl/en/ (live) | check | LINK-ONLY until terms are read | Important Egyptian and Near Eastern collection. |
| Walters Art Museum | https://art.thewalters.org/ (live). openaccess.thewalters.org did not complete from this box. | check (the Walters has an open-access programme; confirm per object) | check | Manuscripts and ancient art; recheck the OA portal. |
| Ashmolean Museum | https://www.ashmolean.org/ (live) | check | LINK-ONLY until terms are read | Egyptian, Near Eastern, and classical collections. |
| Corpus Corporum / MLAT (Zurich) | https://mlat.uzh.ch/ (live). www.corpus-corporum.uzh.ch did not complete from this box. | check | check | Large Latin text corpus; confirm licence before packing. |
| Esoteric Archives (Twilit Grotto) | https://www.esotericarchives.com/ (live) | mixed; site and page copyright caveats — **check** per text | mixed / often REFERENCE-ONLY or PD only for clearly pre-1929 editions | Finding aid for grimoires and early-modern occult prints, not a blanket licence. |
| Embassy of the Free Mind (Ritman / Bibliotheca Philosophica Hermetica) | https://www.embassyofthefreemind.com/ (live); digital catalogue: https://www.embassyofthefreemind.com/digital-collection-search (live) | check | LINK-ONLY until terms are read | Hermetic, alchemical, and rose-cross holdings. |
| Museum of Witchcraft and Magic (Boscastle) | https://museumofwitchcraftandmagic.co.uk/ (live) | check | LINK-ONLY | Practice-history context; not a primary ancient-text corpus. |

### Middle East (Levant, Arabia, Persia, Anatolia)

| Name | URL | License / terms | PDF | Notes |
|---|---|---|---|---|
| Leon Levy Dead Sea Scrolls Digital Library | https://www.deadseascrolls.org.il/ and `/explore-the-archive` (live) | typically personal / research use of images; republication needs permission — **check** | LINK-ONLY for images; modern English editions REFERENCE-ONLY | Primary photographic archive of the Qumran scrolls. Use for witness context (e.g. 4QEn); do not scrape plates into PDFs. |
| Israel Museum | https://www.imj.org.il/ (live, HTTP 247 from this box) | check | LINK-ONLY | Physical home of many DSS and other Judaica; terms **check**. |
| National Library of Israel — Hebrew manuscripts / Ktiv | https://www.nli.org.il/en/discover/manuscripts/hebrew-manuscripts (live); https://ktiv.nli.org.il/ (live, currently redirects to the Hebrew-manuscripts page). Older web.nli.org.il manuscript paths returned 410. | check | LINK-ONLY for images until terms are read | Starting point for Hebrew and some Arabic / Samaritan manuscripts. |
| Princeton Geniza Project | https://geniza.princeton.edu/ (live, `/en/`) | check | check | Catalogue and transcriptions; confirm text vs image rights. |
| Bodleian Hebrew / Genizah | https://genizah.bodleian.ox.ac.uk/ (live, redirects to https://hebrew.bodleian.ox.ac.uk/) | check | LINK-ONLY until terms are read | Complements CUDL and Princeton. |
| Friedberg Jewish Manuscript Society | https://fjms.genizah.org/ (live); https://genizah.org/ redirects here | check (often subscription or restricted tools) | LINK-ONLY / REFERENCE-ONLY until access terms are clear | Major genizah research platform. |
| Qatar Digital Library | https://www.qdl.qa/ and `/en` — live, bot-walled here (403) | often CC BY-NC-SA — **check** | likely REFERENCE-ONLY / LINK-ONLY if NC is confirmed | BL–Qatar digitisation of Arabic and Gulf archives and manuscripts. |
| Qatar National Library | https://www.qnl.qa/ (live) | check | LINK-ONLY until terms are read | National library portal (Arabic landing). |
| National Library and Archives of the UAE | https://www.nla.ae/ (live) | check | LINK-ONLY until terms are read | Starting national-library entry. |
| Al-Maktaba al-Shamela | https://shamela.ws/ (live) | check (many classical Arabic texts are PD as wording; the site and any modern typography / tashkīl may have terms) | check; do not assume a blanket PDF-OK | Very large Arabic book corpus. Prefer a named edition and a read of the site terms before packing. |
| OpenITI | https://openiti.org/ (live). www.openiti.org did not complete from this box. | check (open Arabic-text project; confirm the current data licence) | check | Machine-readable premodern Arabic texts; KITAB is the related research project: https://kitab-project.org/ (live). |
| Corpus Coranicum | https://corpuscoranicum.de/en (live). Site root returned 500; use `/en`. | check (usually view / cite, not a republish licence) | LINK-ONLY until terms are cleared | Quranic manuscripts, variants, and commentary research (already noted in the corpus half). |
| Syriaca.org | https://syriaca.org/ (live) | often CC BY — **check** the current site statement | check; PDF-OK if CC-BY/CC-BY-SA is confirmed, with attribution | Authority data and publications for Syriac persons, places, and works. |
| SEDRA / Beth Mardutho | https://sedra.bethmardutho.org/ (live). www.bethmardutho.org and www.syriaccorpus.org did not complete from this box. | check | check | Syriac lexicon (SEDRA). Digital Syriac Corpus path is **check** (TLS failed here, not treated as dead). |
| Comprehensive Aramaic Lexicon | https://cal.huc.edu/ (live) | check | REFERENCE-ONLY / LINK-ONLY until terms are read | Lexicon and text database; quote sparingly, do not dump entries into PDFs. |
| Hill Museum & Manuscript Library (HMML) | https://hmml.org/ (live); collections: https://hmml.org/collections/ (live). A dedicated `/collections/ethiopia` path returned 404. | institutional image and metadata terms — **check** | LINK-ONLY for images | Catalogues manuscripts across the Middle East, Africa, and Europe, including Syriac, Arabic, and Ge‘ez. vHMML (vhmml.org / www.vhmml.org) did not complete from this box — **check**, not treated as dead. |
| Milli Kütüphane (Turkish National Library) | https://www.millikutuphane.gov.tr/ (live). yazmalar.gov.tr did not complete from this box. | check | LINK-ONLY until terms are read | National library. The yazmalar.gov.tr manuscripts portal is a known resource whose current host is **check**. |
| Encyclopaedia Iranica | https://www.iranicaonline.org/ (live) | in-copyright reference work — **check** any reuse policy | REFERENCE-ONLY | Use for orientation and citation, not as a PDF source. |
| Avesta.org / TITUS Avesta | https://www.avesta.org/ (live); TITUS excerpt https://titus.uni-frankfurt.de/texte/etcs/iran/airan/avesta/avest.htm (live). The TITUS homepage did not complete from this box. | mixed / older translations often PD; site terms and modern editions **check** | mixed | Starting point for Avestan / Pahlavi PD editions; confirm each text. |
| Aga Khan Museum | https://agakhanmuseum.org/ and `/collections/` (live) | check | LINK-ONLY until terms are read | Islamic art and manuscripts. |
| Khalili Collections | https://khalilicollections.org/ (live) | check | LINK-ONLY | Islamic art and manuscript highlights; not assumed open. |
| LoC Persian-language rare materials | https://www.loc.gov/collections/persian-language-rare-materials/ (live) | mixed — **check** | mixed | Complements Iranica and national-library holdings. |
| Alsharekh / Sakhr | https://www.alsharekh.org/ now redirects to https://sakhr.org/ (live) | check | check | Arabic periodical archive; modern typography likely in copyright. |
| Arab Culture Fund | https://www.arabculturefund.org/ (live) | check | LINK-ONLY | Starting cultural-heritage entry, not a text corpus. |
| Altafsir / Quran.com / King Fahd Quran Complex | https://www.altafsir.com/ (live); https://quran.com/ (live); https://qurancomplex.gov.sa/ (live) | mixed; Quranic wording is not under copyright, but typography, translations, and tafsīr editions often are — **check** | mixed; modern translations REFERENCE-ONLY | Use alongside Tanzil (CC BY 3.0, no-change — already catalogued) and Corpus Coranicum. |
| King Faisal Center (KFCRIS) | https://www.kfcris.com/ (live) | check | LINK-ONLY | Research library and manuscripts in Riyadh. |
| Noorlib / Eshia | https://noorlib.ir/ and https://ar.lib.eshia.ir/ (live) | check (likely all-rights or site-specific) | LINK-ONLY / REFERENCE-ONLY until terms are read | Large Persian/Arabic digital libraries; do not scrape. |
| The Islamic Manuscript Association | https://www.islamicmanuscript.org/home.aspx (live) | professional body, not a text host | reference | Standards and bibliography. |
| ISMEO | https://www.ismeo.eu/ (live) | check | REFERENCE-ONLY until a PD/CC publication is named | Italian institute for the Middle and Far East; publications vary. |

### Mesopotamia / Sumer

Cross-reference the corpus entries at the top of this file for **CDLI**
(https://cdli.earth/, live; text generally reusable with attribution; images
NC / permission), **ORACC** (https://oracc.museum.upenn.edu/, CC BY-SA 3.0;
TLS sometimes fails from this box), and **ETCSL** (https://etcsl.orinst.ox.ac.uk/,
editors’ copyright 1998–2006, REFERENCE-ONLY until permission). Do not use
cdli.ucla.edu or cdli.mpiwg-berlin.mpg.de as canonical (old host / 500).

| Name | URL | License / terms | PDF | Notes |
|---|---|---|---|---|
| ISAC (Oriental Institute), University of Chicago | https://isac.uchicago.edu/ (live); former https://oi.uchicago.edu/ redirects here. Publications: https://isac.uchicago.edu/publications (live). Integrated Database: https://isac-idb.uchicago.edu/ (live). Legacy publications: https://oi-archive.uchicago.edu/ (live). Chicago Assyrian Dictionary: https://isac.uchicago.edu/research-projects/chicago-assyrian-dictionary (live). | many older OIP / AS volumes are free to read and often PD or openly posted; object images and recent titles **check** | mixed; PDF-OK for confirmed PD or CC volumes | Prefer ISAC’s named publication series over unofficial scans. IDB is the object catalogue. |
| Penn Museum | https://www.penn.museum/ (live); Expedition magazine: https://www.penn.museum/sites/expedition/ (live). Collections / open-access paths were 403 here. | check (Penn has been expanding open access; confirm per object or publication) | check | Major Babylonian, Sumerian, and Egyptian holdings (Nippur and others), often also in CDLI. |
| Vorderasiatisches Museum (SMB, Berlin) | Museum: https://www.smb.museum/en/museums-institutions/vorderasiatisches-museum/home/ (live); collection page live. Search: https://search.smb.museum/ (live; also id.smb.museum, recherche.smb.museum, smb-digital.de). | mixed; SMB images often CC BY-NC-SA — **check** | mixed / NC often REFERENCE-ONLY or LINK-ONLY | Primary museum for many Mesopotamian objects (including the VAM tablet collections). |
| Iraq Museum | https://iraqmuseum.org/ and https://www.iraqmuseum.org/ (live) | check | LINK-ONLY until terms and the real scope of the digital collection are reviewed | Official-looking museum site is live. Depth of open object data is **check**. Virtual-museum hosts (virtualmuseumiraq.org / .it / .cnr.it) did not complete from this box and are not catalogued as working. |
| Electronic Babylonian Literature (LMU) | https://www.ebl.lmu.de/ (live) | check | check | Current scholarly corpus of Babylonian literary texts; confirm licence before any packing. |
| CDLI Oxford / Virtual Cuneiform | https://cdli.ox.ac.uk/ (live); https://www.virtualcuneiform.org/ (live) | follow CDLI / project terms — **check** | text: follow CDLI; images usually LINK-ONLY | Related CDLI and 3D / visualisation projects. |
| ETANA | https://www.etana.org/ — did not complete from this box | check | check | Long-standing Abzu / core-texts gateway; not treated as dead; recheck. |
| Yale Babylonian Collection | no separate canonical harvest URL confirmed here | objects are largely reachable via CDLI and the holding-institution records — **check** | follow CDLI / Yale record | Do not invent a Yale-only scrape path. |
| British Museum / Louvre / Met Near East | see Europe table | as above | as above | Cross-reference for tablets and reliefs also present in CDLI. |

### Egypt / North Africa (including Coptic and Ethiopic)

TLA, Coptic Scriptorium, and papyri.info remain in the corpus half; this
table adds museums, papyrus collections, and African manuscript projects.

| Name | URL | License / terms | PDF | Notes |
|---|---|---|---|---|
| Thesaurus Linguae Aegyptiae | https://thesaurus-linguae-aegyptiae.de/ (live). https://tla.bbaw.de/ redirects to BBAW digital offerings. | licence page was bot-walled earlier — still **check** | check | Standard digital corpus of Egyptian texts (already flagged in the corpus half). |
| Coptic Scriptorium | https://data.copticscriptorium.org/ (live). www.copticscriptorium.org did not complete from this box. | **per document**; Sahidica may be special-licensed | not cleared until the document header is read | Already catalogued; use GitHub corpora and per-file headers. |
| papyri.info | https://papyri.info/ (live); DDbDP notes: https://papyri.info/docs/ddbdp (live). A `/docs/copyright` path returned 404. | check (DDbDP text is often openly licensed; confirm the current statement) | check | Greek, Latin, Coptic, and Demotic documentary papyri. Images usually remain with the holding institution (LINK-ONLY). |
| Trismegistos | https://www.trismegistos.org/ — live, bot-walled here (403) | check | LINK-ONLY / reference | Metadata hub for papyri and related texts, not a text-reuse licence. |
| Griffith Institute, Oxford | https://www.griffith.ox.ac.uk/ (live); publications path returned 300 here | check | mixed / often LINK-ONLY for archive photos (Tutankhamun, etc.) | Egyptological archive and publications; confirm each series. |
| IFAO (Cairo) | https://www.ifao.egnet.net/ (live); bases: https://www.ifao.egnet.net/bases/ (live); archives: https://www.ifao.egnet.net/bases/archives/ (live); publications: https://www.ifao.egnet.net/publications/ (live) | mixed — **check** | mixed | French Institute in Cairo; databases and some online publications. |
| Bibliotheca Alexandrina | https://www.bibalex.org/ and https://www.bibalex.org/en (live) | check | LINK-ONLY until terms are read | Library and digital projects in Alexandria; not a blanket open corpus. |
| Digital Egypt for Universities (UCL) | https://www.digitalegypt.ucl.ac.uk/ (live, static UCL path) | check | check | Teaching site; reuse terms **check**; do not treat as a critical edition. |
| Petrie Museum (UCL) | current UCL collections page live (older petrie.ucl.ac.uk and some culture paths redirect) | check | LINK-ONLY until terms are read | Egyptian and Sudanese archaeology collection. |
| Global Egyptian Museum | https://www.globalegyptianmuseum.org/ (live) | check | LINK-ONLY | Aggregated object records from many museums; rights follow the lender. |
| Official Egyptian monuments portal | https://egymonuments.gov.eg/ and `/en` (live) | check | LINK-ONLY | Ministry / monuments gateway. egyptianmuseumcairo.eg returned 403; antiquities.gov.eg and egyptianmuseum.gov.eg did not complete from this box. No clear, rights-cleared open corpus of Cairo Museum objects was verified here. Use official portals as LINK-ONLY and **check** before any reuse. |
| Ägyptisches Museum und Papyrussammlung (SMB) | https://www.smb.museum/en/museums-institutions/aegyptisches-museum-und-papyrussammlung/home/ (live); objects via https://search.smb.museum/ | mixed; often CC BY-NC-SA for SMB images — **check** | mixed / NC often LINK-ONLY or REFERENCE-ONLY | Berlin Egyptian museum and papyrus collection. |
| University of Michigan Papyrology | https://www.lib.umich.edu/collections/collecting-areas/special-collections/papyrology-collection/ (live) | check | LINK-ONLY for images | Major papyrus collection; editions vary in licence. |
| Centre for the Study of Ancient Documents (Oxford) | https://www.csad.ox.ac.uk/ (live) | check | LINK-ONLY until terms are read | Epigraphy and papyrology gateway. POxy / papyrology.ox.ac.uk did not complete from this box — **check**, not treated as dead. Images of P.Oxy. (including P.Oxy. LVI 4499 = P115) are **LINK-ONLY** unless a record says otherwise. |
| Hamburg / CSMC Ethiopian studies | https://www.manuscript-cultures.uni-hamburg.de/ (live, now csmc.uni-hamburg.de); https://www.aai.uni-hamburg.de/en/ethiostudies.html (live). Beta Maṣāḥǝft hosts did not complete from this box. | check | check | Leading Ge‘ez manuscript research. Beta Maṣāḥǝft (beta-maasaheft.uni-hamburg.de) is **check**, not treated as dead. EMIP and other Ethiopia catalogues are often reached through HMML. |
| National Library of Tunisia | https://www.bnt.nat.tn/ (live) | check | LINK-ONLY until terms are read | Starting North African national-library entry. bnt / bnrm.ma / other Maghreb hosts were mixed or failed here — expand later. |

### Other (India / Sanskrit, Armenia / Georgia, Central Asia)

| Name | URL | License / terms | PDF | Notes |
|---|---|---|---|---|
| GRETIL (Göttingen Register of Electronic Texts in Indian Languages) | https://gretil.sub.uni-goettingen.de/ and https://gretil.sub.uni-goettingen.de/gretil.html (live) | typically “free for scholarly use” with project conditions, not automatically CC — **check** the current statement | check | Standard electronic Sanskrit and Middle-Indic text collection. |
| Cologne Digital Sanskrit Dictionaries | https://www.sanskrit-lexicon.uni-koeln.de/ (live) | check | REFERENCE-ONLY / LINK-ONLY for lexicon dumps until terms are read | Dictionaries, not primary narrative texts. |
| The Sanskrit Library | https://www.sanskritlibrary.org/ (live) | check | check | Texts and display tools; confirm licence per work. |
| Muktabodha Digital Library | https://muktabodha.org/ and https://muktabodha.org/digital-library/ (live) | check | check | Shaiva and related manuscript and text collections. |
| SARIT | https://sarit.indology.info/ returned 500 here; www.sarit.net did not complete | check | check | Searchable Sanskrit; recheck, not dropped as a concept. |
| IGNCA | https://ignca.gov.in/ (live) | check | LINK-ONLY until terms are read | Indian cultural-heritage catalogues and some manuscript projects. Namami (namami.gov.in) did not complete from this box — **check**. |
| Matenadaran (Mesrop Mashtots Institute, Yerevan) | https://matenadaran.am/ and https://matenadaran.am/en/ (live) | check | LINK-ONLY until terms are read | Primary Armenian manuscript institute. |
| Digilib Armenia | https://www.digilib.am/ and https://www.digilib.am/en (live). Bare `digilib.am` failed from this box; use www. | check | check | Armenian digital library; confirm licence per work. |
| Georgian manuscripts / manuscript.ge | https://manuscript.ge/ and https://manuscript.ge/en/ (live) | check | LINK-ONLY until terms are read | Georgian manuscript portal. |
| National Parliamentary Library of Georgia | https://www.nplg.gov.ge/ (live). An `/en` path and an old gsdl library.exe path failed or 500. | check | LINK-ONLY | National library starting entry. |
| International Dunhuang Project (IDP) | https://idp.bl.uk/ — live, bot-walled here (403). www.internationaldunhuangproject.org did not complete. | institutional image terms — **check** | LINK-ONLY for images | Stein, Pelliot, and related Central Asian manuscripts. Gallica Fonds Pelliot paths were also bot-walled (403). |
| Buddhist Digital Resource Center (BDRC / TBRC) | https://www.bdrc.io/ (live); https://library.bdrc.io/ (live); https://www.tbrc.org/ (live) | mixed — **check** per work | mixed / often LINK-ONLY | Tibetan and related Buddhist texts and scans. |
| UNESCO Silk Roads / documentary heritage | older en.unesco.org/silkroad paths 404 or redirect; https://www.unesco.org/en/silkroads (via redirect) and https://unesdoc.unesco.org/ (live) | mixed | LINK-ONLY / REFERENCE-ONLY | Orientation and bibliography, not a primary-text licence. |
| DSBC (Digital Sanskrit Buddhist Canon) | https://www.dsbcproject.org/ (live) | check | check | Sanskrit Buddhist texts; confirm licence. |

---

## Sources checked and not used as canonical

| URL | Outcome |
|---|---|
| https://cdli.ucla.edu/ | Old host; TLS failure. Use https://cdli.earth/ |
| https://oracc.org/ | TLS failure here. Use https://oracc.museum.upenn.edu/ |
| https://first1k.info/ | TLS failure here. Use the GitHub Pages catalogue |
| https://www.ccel.org/copyprotect.html and `/info/copyright` | 404. Use per-work CCEL pages |
| https://tanzil.net/docs/copyright | Missing-page stub. Use `/docs/text_license` |
| https://www.textexcavation.com/ | HTTP 522 from here; not catalogued as a source |
| https://codexsinaiticus.org/ | TLS failure here; **not dropped as dead** — recheck |
| https://www.bl.uk/manuscripts/ | 404. BL digitised-MSS portal path is still **check** (`manuscripts.bl.uk` did not complete from this box) |
| https://web.nli.org.il/sites/nlis/en/manuscript and the old NLI digital-library path | 410. Use https://www.nli.org.il/en/discover/manuscripts/hebrew-manuscripts and https://ktiv.nli.org.il/ |
| https://www.nli.org.il/en/discover/manuscripts/ktiv | 404. Use the Hebrew-manuscripts URL or ktiv.nli.org.il (redirects) |
| https://sinai.library.ucla.edu/ | 404. UCLA Sinai Palimpsests current portal is **check** |
| https://hmml.org/collections/ethiopia/ | 404. Use https://hmml.org/collections/ |
| https://www.vaticanlibrary.va/en.html | 404. Use https://www.vaticanlibrary.va/ |
| https://www.corpuscoranicum.de/ (root) | 500. Use https://corpuscoranicum.de/en |
| https://cdli.mpiwg-berlin.mpg.de/ | 500. Use https://cdli.earth/ |
| Virtual Iraq museum hosts (`virtualmuseumiraq.org`, `.it`, `.cnr.it`) | Connection failed from this box; not catalogued as working |
| https://egyptmuseum.com/ | 500; unofficial. Not used. Official Cairo Museum hosts were 403 or unreachable; use https://egymonuments.gov.eg/ as LINK-ONLY and **check** |
| https://manuscripta-mediaevalia.de/ | Redirects to https://handschriftenportal.de/ |
| https://www.wdl.org/ | Redirects to the LoC World Digital Library collection |

Gallica, the British Museum, Europeana, HathiTrust, QDL, the Morgan, Penn
Museum collections pages, BNE, the Met Open Access policy page (429), IDP,
and Trismegistos returned 403 or 429 from this environment and were **not**
dropped.

---

## Working principle for the first harvest (not yet started)

1. Pick a pack from a case-study `packs.md` or a goddess-series need.
2. Choose a PDF-OK edition from this catalog; copy its licence into the pack
   front matter.
3. Log copyrighted standard works (Betz, NHL translations, ETCSL, Lamsa,
   Athanassakis, recent Loebs) as REFERENCE-ONLY.
4. Score the pack, including licence and witness-distance.
5. Only then, and only with a PDF-OK licence, ask Grok Bot to render a PDF.
