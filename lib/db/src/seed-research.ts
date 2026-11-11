/**
 * Idempotent seed for research-workflow demo data.
 * Run via: pnpm --filter @workspace/db run seed:research
 *
 * Creates:
 *  - 2 research projects with saved sources and notes
 *  - 3 claim cards with evidence items referencing seeded sources
 *
 * Requires the main source seed to have run first (pnpm --filter @workspace/db run seed).
 */

import { db, sourcesTable } from "./index.js";
import {
  researchProjectsTable,
  savedSourcesTable,
  notesTable,
} from "./schema/projects.js";
import {
  claimCardsTable,
  evidenceTable,
} from "./schema/claims.js";
import { eq, inArray } from "drizzle-orm";

// ── Lookup helpers ─────────────────────────────────────────────────────────────

async function findSourceByTitle(title: string): Promise<number | null> {
  const rows = await db
    .select({ id: sourcesTable.id })
    .from(sourcesTable)
    .where(eq(sourcesTable.title, title));
  return rows[0]?.id ?? null;
}

async function findOrCreateProject(title: string, description: string, researcherType: string) {
  const existing = await db
    .select()
    .from(researchProjectsTable)
    .where(eq(researchProjectsTable.title, title));
  if (existing.length > 0) return existing[0];
  const [created] = await db
    .insert(researchProjectsTable)
    .values({ title, description, researcherType })
    .returning();
  return created;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱  Starting research seed…");

  // ── Source IDs (looked up by title) ──────────────────────────────────────

  const [
    tacitusId,
    josephusId,
    plinyId,
    pilateId,
    deadSeaId,
    codexId,
    ossuaryId,
    irelandId,
    census1880Id,
    census1911Id,
  ] = await Promise.all([
    findSourceByTitle("Tacitus, Annals XV.44 — Nero and the Christians"),
    findSourceByTitle("Josephus, Antiquities of the Jews XVIII.3.3 — Testimonium Flavianum"),
    findSourceByTitle("Pliny the Younger, Epistulae X.96 — Letter to Trajan on Christians"),
    findSourceByTitle("Pontius Pilate Inscription (Caesarea Maritima Dedicatory Stone)"),
    findSourceByTitle("Dead Sea Scrolls — Isaiah Scroll (1QIsa-a), Isaiah 53"),
    findSourceByTitle("Codex Sinaiticus — New Testament (Matthew 5:3–12, Beatitudes)"),
    findSourceByTitle("Ossuary Inscription of James, Son of Joseph, Brother of Jesus"),
    findSourceByTitle("Ireland Civil Registration Index — Births 1864–1900 (Connacht Province)"),
    findSourceByTitle("United States Federal Census 1880 — Full Population Schedule"),
    findSourceByTitle("England & Wales Census 1911 — Individual Household Returns"),
  ]);

  // ── Project 1: Historical Jesus Source Analysis ──────────────────────────

  const p1 = await findOrCreateProject(
    "Historical Jesus: Source Analysis",
    "A systematic review of non-Christian and early Christian primary sources bearing on the historicity of Jesus of Nazareth. Each source is graded by provenance confidence and its relationship to the core historical claims is evaluated.",
    "historian"
  );
  console.log(`  ${p1.title.includes("already") ? "–" : "✔"} Project: ${p1.title}`);

  // Saved sources for project 1
  const p1Sources = [tacitusId, josephusId, plinyId, pilateId, deadSeaId, codexId].filter(Boolean) as number[];
  for (const sourceId of p1Sources) {
    const already = await db
      .select()
      .from(savedSourcesTable)
      .where(eq(savedSourcesTable.projectId, p1.id));
    const alreadyHas = already.some((r) => r.sourceId === sourceId);
    if (!alreadyHas) {
      await db.insert(savedSourcesTable).values({ projectId: p1.id, sourceId });
      console.log(`    ✔ Saved source ${sourceId} → project ${p1.id}`);
    } else {
      console.log(`    – Source ${sourceId} already saved`);
    }
  }

  // Notes for project 1
  const p1Notes = [
    {
      title: "Methodology: grading non-Christian sources",
      content: `## Approach

This project applies a consistent confidence rubric to each source:

**High Confidence** — Manuscript tradition strong, text universally accepted, no plausible interpolation motive.  
**Medium Confidence** — Core text accepted but subject to partial interpolation debate.  
**Low / Uncertain** — Text authenticity contested; use only as indirect evidence.

## Key finding (preliminary)

Three independent high-confidence sources (Tacitus, Pliny, Josephus core) converge on: execution under Pilate, early 1st century Judaea, a following that persisted after death. This convergence is methodologically significant even before considering internal Christian sources.`,
    },
    {
      title: "Note: Tacitus as the strongest non-Christian witness",
      content: `## Why Tacitus Annals XV.44 carries high weight

1. **Hostile source** — Tacitus is openly contemptuous of Christianity ("deadly superstition"). Hostile sources have lower motivation to fabricate positive claims.
2. **Single manuscript tradition** — The passage comes from the Codex Mediceus II (11th c.). Unlike Josephus, there is no known interpolation history.
3. **Administrative plausibility** — Tacitus was a senior Roman official with access to official records. The detail "procurator Pontius Pilatus" reflects accurate Roman administrative terminology (cf. the Pilate inscription confirming the title "Praefectus").

**Cross-reference**: Save and compare with the Pilate inscription for the title discrepancy (Praefectus vs Procurator).`,
    },
  ];

  for (const note of p1Notes) {
    const existing = await db
      .select()
      .from(notesTable)
      .where(eq(notesTable.projectId, p1.id));
    const alreadyHas = existing.some((n) => n.title === note.title);
    if (!alreadyHas) {
      await db.insert(notesTable).values({ projectId: p1.id, ...note });
      console.log(`    ✔ Note: ${note.title}`);
    } else {
      console.log(`    – Note already exists: ${note.title}`);
    }
  }

  // ── Project 2: Burke Family Genealogy 1850–1920 ──────────────────────────

  const p2 = await findOrCreateProject(
    "Burke Family Genealogy 1850–1920",
    "Tracing the Burke family line from County Galway, Ireland through emigration to the United States and England. Covers civil registration records, census schedules, and passenger manifests across three jurisdictions.",
    "genealogist"
  );
  console.log(`  ${p2.title.includes("already") ? "–" : "✔"} Project: ${p2.title}`);

  const p2Sources = [irelandId, census1880Id, census1911Id].filter(Boolean) as number[];
  for (const sourceId of p2Sources) {
    const already = await db.select().from(savedSourcesTable).where(eq(savedSourcesTable.projectId, p2.id));
    const alreadyHas = already.some((r) => r.sourceId === sourceId);
    if (!alreadyHas) {
      await db.insert(savedSourcesTable).values({ projectId: p2.id, sourceId });
      console.log(`    ✔ Saved source ${sourceId} → project ${p2.id}`);
    } else {
      console.log(`    – Source ${sourceId} already saved`);
    }
  }

  const p2Notes = [
    {
      title: "Search strategy: Ireland Civil Registration Index",
      content: `## Galway searches

Working hypothesis: the Burke line emigrated from County Galway between 1870 and 1890, most likely post-Famine secondary wave.

**Search terms used:**
- Surname: Burke (and variants: Bourke)
- District: Galway, Tuam, Loughrea
- Year range: 1864–1885

**Next step:** Cross-check any birth index matches against the PRDH Quebec records to rule out Canada emigration route before assuming direct Ireland → USA trajectory.

⚠️ FamilySearch index used for initial triage — verify all matches against original GRO register images at IrishGenealogy.ie.`,
    },
    {
      title: "1880 US Census hit — possible match",
      content: `## Potential match: Patrick Burke, Cook County, Illinois

Found in 1880 Federal Census index: Patrick Burke, age 32, born Ireland, wife Mary (née Conneely), born Ireland, children Thomas (8) and Bridget (6) born Illinois.

If Patrick Burke was born c.1848 in Ireland, this is consistent with the pre-Famine birth window and a likely emigration date of late 1860s or early 1870s.

**Action items:**
1. Pull full household image from Ancestry.com (T9 microfilm)
2. Check Patrick's birthplace county if recorded
3. Search New York passenger manifests 1865–1875 for Patrick Burke + Mary Conneely

**Confidence: Low** — surname is common. Need corroborating detail before linking to the Galway Burke line.`,
    },
  ];

  for (const note of p2Notes) {
    const existing = await db.select().from(notesTable).where(eq(notesTable.projectId, p2.id));
    const alreadyHas = existing.some((n) => n.title === note.title);
    if (!alreadyHas) {
      await db.insert(notesTable).values({ projectId: p2.id, ...note });
      console.log(`    ✔ Note: ${note.title}`);
    } else {
      console.log(`    – Note already exists: ${note.title}`);
    }
  }

  // ── Claim Cards ──────────────────────────────────────────────────────────

  const claimsToSeed = [
    {
      title: "Jesus was executed under Pontius Pilate",
      claim:
        "Jesus of Nazareth was executed by crucifixion under the authority of the Roman prefect Pontius Pilate, in the province of Judaea, during the reign of Tiberius (c. 30–33 CE).",
      status: "supported",
      projectId: p1.id,
      evidence: [
        tacitusId && {
          sourceId: tacitusId,
          role: "supports",
          summary:
            "Tacitus explicitly names 'Christus' as executed under 'Pontius Pilatus' during Tiberius's reign (Annals XV.44). High-confidence hostile source with no known interpolation history.",
        },
        josephusId && {
          sourceId: josephusId,
          role: "supports",
          summary:
            "The Josephan core of the Testimonium Flavianum references execution, though the exact phrasing is disputed due to probable Christian interpolation. The reference is accepted by most critical scholars as preserving an authentic Josephan notice.",
        },
        pilateId && {
          sourceId: pilateId,
          role: "contextualizes",
          summary:
            "The Caesarea Maritima inscription confirms Pilate's existence and his correct title (Praefectus Iudaeae), corroborating the administrative setting of the execution accounts. Does not directly attest the execution.",
        },
        plinyId && {
          sourceId: plinyId,
          role: "contextualizes",
          summary:
            "Pliny's letter describes Christians worshipping 'Christ as a god' c.112 CE — confirming an active following 80 years after the alleged execution, consistent with a historical founding figure.",
        },
      ].filter(Boolean) as { sourceId: number; role: string; summary: string }[],
    },
    {
      title: "The name 'Christus' or 'Christ' appears in non-Christian sources within 100 years of the crucifixion",
      claim:
        "The title 'Christus' (Greek: Χριστός) or 'Christians' as derived from it appears in at least two independent non-Christian Latin sources written within 100 years of the crucifixion date.",
      status: "supported",
      projectId: p1.id,
      evidence: [
        tacitusId && {
          sourceId: tacitusId,
          role: "supports",
          summary:
            "Tacitus uses 'Christus' as a proper noun and explains that 'Christians' derive their name from him (Annals XV.44, c.116 CE — 83 years after the crucifixion date).",
        },
        plinyId && {
          sourceId: plinyId,
          role: "supports",
          summary:
            "Pliny refers to Christians singing a hymn 'to Christ as to a god' (Epistulae X.96, c.112 CE). Independent of Tacitus — different author, different province, different context.",
        },
        ossuaryId && {
          sourceId: ossuaryId,
          role: "neutral",
          summary:
            "The James Ossuary inscription includes 'Yeshua' (Jesus) if authentic, but authenticity of the second half of the inscription is disputed. Listed for completeness; not treated as primary evidence for this claim.",
        },
      ].filter(Boolean) as { sourceId: number; role: string; summary: string }[],
    },
    {
      title: "Isaiah 53 predates the Common Era by at least 100 years",
      claim:
        "The text of Isaiah 53 in substantially its current form existed at least 100 years before the Common Era, as demonstrated by the Dead Sea Scrolls discovery.",
      status: "supported",
      projectId: p1.id,
      evidence: [
        deadSeaId && {
          sourceId: deadSeaId,
          role: "supports",
          summary:
            "1QIsa-a (the Great Isaiah Scroll) has been carbon-14 dated to c.335–107 BCE (95% confidence), with palaeographic analysis suggesting c.125–100 BCE. The scroll contains Isaiah 53 in a form very close to the later Masoretic Text, demonstrating the passage's antiquity.",
        },
        codexId && {
          sourceId: codexId,
          role: "contextualizes",
          summary:
            "Codex Sinaiticus (c.350 CE) preserves the Greek Septuagint version of Isaiah, which itself predates the Common Era. Its text shows the stable transmission of Isaiah 53 across centuries and script traditions.",
        },
      ].filter(Boolean) as { sourceId: number; role: string; summary: string }[],
    },
  ];

  for (const claimData of claimsToSeed) {
    const { evidence, ...claimFields } = claimData;
    const existing = await db
      .select()
      .from(claimCardsTable)
      .where(eq(claimCardsTable.title, claimFields.title));

    let claimId: number;
    if (existing.length > 0) {
      claimId = existing[0].id;
      console.log(`  – Claim already exists: ${claimFields.title}`);
    } else {
      const [created] = await db
        .insert(claimCardsTable)
        .values(claimFields)
        .returning();
      claimId = created.id;
      console.log(`  ✔ Claim: ${claimFields.title}`);
    }

    // Evidence items
    const existingEvidence = await db
      .select()
      .from(evidenceTable)
      .where(eq(evidenceTable.claimCardId, claimId));

    for (const ev of evidence) {
      const alreadyHas = existingEvidence.some(
        (e) => e.sourceId === ev.sourceId && e.claimCardId === claimId
      );
      if (!alreadyHas) {
        await db
          .insert(evidenceTable)
          .values({ claimCardId: claimId, ...ev });
        console.log(`    ✔ Evidence: source ${ev.sourceId} → ${ev.role}`);
      } else {
        console.log(`    – Evidence already exists: source ${ev.sourceId}`);
      }
    }
  }

  console.log("🌱  Research seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Research seed failed:", err);
  process.exit(1);
});
