/**
 * Idempotent seed for Research Commons forum demo data.
 * Run via: pnpm --filter @workspace/db run seed:forum
 *
 * Creates 4 threads with 2–3 replies each, tied to existing archive sources.
 * Authors are mock researcher personas — no real auth required.
 */

import { db } from "./index.js";
import { forumThreadsTable, forumRepliesTable } from "./schema/forum.js";
import { eq } from "drizzle-orm";

async function findOrCreateThread(
  title: string,
  content: string,
  category: string,
  authorName: string,
  tags: string[]
) {
  const existing = await db
    .select()
    .from(forumThreadsTable)
    .where(eq(forumThreadsTable.title, title));
  if (existing.length > 0) {
    console.log(`  – Thread already exists: "${title}"`);
    return existing[0];
  }
  const [created] = await db
    .insert(forumThreadsTable)
    .values({ title, content, category, authorName, tags })
    .returning();
  console.log(`  ✔ Thread: "${title}"`);
  return created;
}

async function addReply(
  threadId: number,
  content: string,
  authorName: string,
  existingReplies: { authorName: string; content: string }[]
) {
  // Idempotency: skip if this author already has a reply with the same first 80 chars
  const fingerprint = content.slice(0, 80);
  const alreadyHas = existingReplies.some(
    (r) => r.authorName === authorName && r.content.startsWith(fingerprint)
  );
  if (alreadyHas) {
    console.log(`    – Reply by ${authorName} already exists`);
    return;
  }
  await db.insert(forumRepliesTable).values({ threadId, content, authorName });
  console.log(`    ✔ Reply by ${authorName}`);
}

async function seed() {
  console.log("🌱  Starting forum seed…");

  // ── Thread 1: Tacitus Annals XV.44 authenticity ───────────────────────────
  const t1 = await findOrCreateThread(
    "Tacitus Annals XV.44 — is the 'Christus' passage authentic?",
    `## Opening question

The reference to "Christus" in Tacitus *Annals* XV.44 is the most-cited non-Christian evidence for the execution of Jesus of Nazareth. But how solid is it?

The main text (Codex Mediceus II, 11th century) reads:
> *"auctor nominis eius Christus Tibero imperitante per procuratorem Pontium Pilatum supplicio adfectus erat"*

Key questions I'd like to discuss:

1. **Manuscript integrity** — the passage comes from a single manuscript tradition. Does the absence of earlier copies undermine its probative value, or is this standard for Tacitean texts?
2. **"Procurator" vs "Praefectus"** — the Pilate inscription (Caesarea Maritima, 1961) gives Pilate the title *Praefectus*, but Tacitus uses *procurator*. Is this an error, or was the title used informally?
3. **Interpolation arguments** — some scholars (e.g. Hochart, Drews) have argued the passage was inserted by a Christian copyist. What is the current critical consensus?

Linking to the archive record: [Tacitus, Annals XV.44](/sources/13)`,
    "primary-sources",
    "Dr. Sarah Chen",
    ["tacitus", "roman-sources", "historical-jesus", "textual-criticism"]
  );

  const t1Replies = await db
    .select()
    .from(forumRepliesTable)
    .where(eq(forumRepliesTable.threadId, t1.id));

  await addReply(
    t1.id,
    `Good summary. On the "procurator" vs "praefectus" question: the standard explanation is that Tacitus (writing c.116 CE) anachronistically applied the title current in his own day. Under the Flavians, Judaea's governor was elevated from *praefectus* to *legatus* with the *procurator* designation used for the financial officer. Tacitus may simply be using the term loosely — he is not writing a technical administrative treatise. Sherwin-White's *Roman Society and Roman Law in the New Testament* (1963) covers this in detail.

The interpolation hypothesis has not fared well. Syme, Koestermann, and more recently Christopher Jones have all concluded that the passage's style, vocabulary, and anti-Christian tone are entirely consistent with Tacitus. A Christian forger would almost certainly have been more favorable to Christianity.`,
    "Prof. Michael Torres",
    t1Replies
  );

  await addReply(
    t1.id,
    `On the manuscript question: the Codex Mediceus II is late, but this is actually typical for Tacitus. *Annals* I–VI survive in a single 9th-century manuscript (Codex Mediceus I). Scholars do not generally treat this as grounds for wholesale skepticism about the text. The question is whether there are internal indicators of interpolation — and the answer is no. The hostility of the passage toward Christians ("exitiabilis superstitio" — "deadly superstition") is exactly what we should expect from Tacitus's own documented contempt for eastern religions.

I'd distinguish this sharply from the Testimonium Flavianum in Josephus, where there *are* strong internal indicators of partial Christian interpolation.`,
    "David Reinholt",
    t1Replies
  );

  await addReply(
    t1.id,
    `Worth flagging: the passage's evidential weight for the historical Jesus is often overstated. What Tacitus attests is:
- A person called "Christus" (a title, not a name)
- Execution under Pilate, during Tiberius's reign
- A following that persisted and spread to Rome

This does **not** independently attest the name "Jesus," the details of the trial, or any theological claims. For what it does establish, it is strong evidence. But the archive record should probably note explicitly that Tacitus is reporting what Christians believed, filtered through his hostile perspective — he is not an eyewitness and wrote 80+ years after the events.`,
    "Dr. Sarah Chen",
    t1Replies
  );

  // ── Thread 2: Dead Sea Scrolls — palaeography vs. carbon-14 ──────────────
  const t2 = await findOrCreateThread(
    "Dating the Dead Sea Scrolls: palaeography vs. carbon-14 — which should we trust?",
    `## Background

1QIsa-a (the Great Isaiah Scroll) has two main dating frameworks:

- **Palaeographic dating**: Based on the script style, John Trever and Frank Cross placed the scroll at c.125–100 BCE.
- **Carbon-14 dating**: AMS tests (1991, Zurich; 1994, Tucson) returned calibrated ranges of roughly 335–107 BCE (95% confidence interval), with a midpoint often cited around 150–125 BCE.

The two methods broadly agree, but the C-14 range is wide. Some scholars have raised questions about sample contamination and calibration curves for this period (the "Hallstatt Plateau" issue).

**Question for the group**: When these two methodologies produce overlapping but non-identical ranges, how should we weight them? And does either method have known systematic biases that affect Dead Sea Scrolls dating specifically?

Archive record: [Dead Sea Scrolls — Isaiah Scroll (1QIsa-a)](/sources/15)`,
    "primary-sources",
    "Miriam Katz",
    ["dead-sea-scrolls", "radiocarbon-dating", "palaeography", "manuscript-dating"]
  );

  const t2Replies = await db
    .select()
    .from(forumRepliesTable)
    .where(eq(forumRepliesTable.threadId, t2.id));

  await addReply(
    t2.id,
    `The Hallstatt Plateau is a real methodological issue for this period. The calibration curve for roughly 800–400 BCE is nearly flat — multiple calendar dates map to the same C-14 ratio — which produces wide, sometimes bimodal calibrated ranges. For scrolls dating to the 2nd–1st century BCE, we are on the edge of this plateau, which is why the 95% confidence interval for 1QIsa-a is so wide (over two centuries).

In practice, most Dead Sea Scrolls scholars treat palaeography and C-14 as complementary rather than competing. When they agree, confidence is higher. The consensus for 1QIsa-a is broadly 2nd century BCE, which both methods support. The specific midpoint is less important than the upper bound: the scroll demonstrably predates the Common Era.`,
    "Dr. Sarah Chen",
    t2Replies
  );

  await addReply(
    t2.id,
    `One thing to be careful about: palaeography is not independent of C-14 dating in the way we might hope. Frank Cross's palaeographic chronology was itself partly calibrated against early C-14 results. There is some circularity risk if you use palaeography to "correct" C-14 results that were used to calibrate the palaeographic sequence in the first place.

Gregory Doudna's *4Q Pesher Nahum* study (2002) raised this concern explicitly. I do not think it overturns the broad dating consensus, but it is worth being explicit about the methodological dependencies when citing confidence levels.`,
    "Miriam Katz",
    t2Replies
  );

  // ── Thread 3: James Ossuary — authenticity debate ─────────────────────────
  const t4 = await findOrCreateThread(
    "The James Ossuary inscription: what does the current state of scholarship say?",
    `## A contested source

The James Ossuary (archive record: [Ossuary Inscription of James, Son of Joseph, Brother of Jesus](/sources/26)) is one of the more contested pieces of epigraphic evidence in the archive. The inscription reads:

> *Ya'akov bar Yosef akhui diYeshua*
> "James, son of Joseph, brother of Jesus"

The first half of the inscription ("James son of Joseph") is widely accepted as authentic. The second half ("brother of Jesus") has been the subject of a long-running authenticity dispute, including a seven-year Israeli forgery trial that ended in acquittal (2012) — though the acquittal was on grounds of insufficient evidence rather than demonstrated authenticity.

I want to start a thread tracking the state of scholarship since the acquittal. Has anything materially changed?`,
    "primary-sources",
    "Prof. Michael Torres",
    ["epigraphy", "ossuary", "james", "authenticity", "first-century"]
  );

  const t4Replies = await db
    .select()
    .from(forumRepliesTable)
    .where(eq(forumRepliesTable.threadId, t4.id));

  await addReply(
    t4.id,
    `The post-acquittal landscape has not settled the question. The main technical disagreement is over the patina — specifically whether the patina inside the letter cuts of "akhui diYeshua" matches the patina on the first half and the ossuary surface generally.

The prosecution's expert (Yuval Goren) argued the patina on the second half was "fake" — manufactured to look old. Oded Golan's defense team countered with independent analysis by Wolfgang Krumbein suggesting genuine biological patina throughout. Neither side has persuaded the other, and I am not aware of a definitive peer-reviewed resolution since 2012.

The honest position for the archive is: *first half authentic; second half authenticity genuinely uncertain; do not cite as evidence for the historicity of Jesus without flagging the dispute prominently.*`,
    "Dr. Sarah Chen",
    t4Replies
  );

  await addReply(
    t4.id,
    `One underappreciated point: even if the entire inscription is authentic, its evidential value for the historical Jesus is more limited than is commonly claimed. "Jesus" (Yeshua) was among the most common male names in 1st-century Judaea — Tal Ilan's lexicon of Jewish names documents over 70 individuals named Yeshua in the Second Temple period. The combination "James son of Joseph brother of Jesus" matching the NT figures requires a prior probability estimate that most popular accounts skip entirely.

André Lemaire's original publication estimated the probability of the combination at roughly 1 in 25, but this has been challenged as underestimating name frequencies. The archive note should flag this statistical dimension so researchers can weigh it appropriately.`,
    "Miriam Katz",
    t4Replies
  );

  console.log("🌱  Forum seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Forum seed failed:", err);
  process.exit(1);
});
