import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, claimCardsTable, evidenceTable, sourcesTable } from "@workspace/db";
import {
  CreateClaimCardBody,
  UpdateClaimCardBody,
  AddEvidenceBody,
} from "@workspace/api-zod";

const router = Router();

async function formatClaimCard(row: typeof claimCardsTable.$inferSelect) {
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(evidenceTable)
    .where(eq(evidenceTable.claimCardId, row.id));
  return {
    id: row.id,
    title: row.title,
    claim: row.claim,
    status: row.status,
    projectId: row.projectId ?? null,
    evidenceCount: countResult?.count ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function formatEvidence(row: typeof evidenceTable.$inferSelect) {
  const [src] = await db.select().from(sourcesTable).where(eq(sourcesTable.id, row.sourceId));
  return {
    id: row.id,
    claimCardId: row.claimCardId,
    sourceId: row.sourceId,
    source: src ? {
      id: src.id, title: src.title, sourceType: src.sourceType,
      collectionSlug: src.collectionSlug ?? null, collectionName: null,
      author: src.author ?? null, dateLabel: src.dateLabel ?? null,
      language: src.language ?? null, originalLanguage: src.originalLanguage ?? null,
      provenance: src.provenance, confidence: src.confidence,
      chronology: src.chronology ?? null, availability: src.availability,
      rightsStatement: src.rightsStatement ?? null, description: src.description ?? null,
      excerpt: src.excerpt ?? null, externalUrl: src.externalUrl ?? null,
      tags: src.tags, createdAt: src.createdAt.toISOString(),
    } : undefined,
    role: row.role,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /claim-cards
router.get("/claim-cards", async (req, res): Promise<void> => {
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string, 10) : undefined;
  const rows = projectId
    ? await db.select().from(claimCardsTable).where(eq(claimCardsTable.projectId, projectId))
    : await db.select().from(claimCardsTable);
  const formatted = await Promise.all(rows.map(formatClaimCard));
  res.json(formatted);
});

// POST /claim-cards
router.post("/claim-cards", async (req, res): Promise<void> => {
  const parsed = CreateClaimCardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(claimCardsTable).values(parsed.data).returning();
  res.status(201).json(await formatClaimCard(row));
});

// GET /claim-cards/:id
router.get("/claim-cards/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select().from(claimCardsTable).where(eq(claimCardsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatClaimCard(row));
});

// PATCH /claim-cards/:id
router.patch("/claim-cards/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateClaimCardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(claimCardsTable).set(parsed.data).where(eq(claimCardsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatClaimCard(updated));
});

// GET /claim-cards/:id/evidence-trail
router.get("/claim-cards/:id/evidence-trail", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [card] = await db.select().from(claimCardsTable).where(eq(claimCardsTable.id, id));
  if (!card) { res.status(404).json({ error: "Not found" }); return; }
  const evidenceRows = await db.select().from(evidenceTable).where(eq(evidenceTable.claimCardId, id));
  const formatted = await Promise.all(evidenceRows.map(formatEvidence));
  const supportCount = formatted.filter((e) => e.role === "supports").length;
  const contradictCount = formatted.filter((e) => e.role === "contradicts").length;
  const summary = `This claim has ${formatted.length} piece(s) of evidence: ${supportCount} supporting, ${contradictCount} contradicting.`;
  res.json({ claimCard: await formatClaimCard(card), evidence: formatted, summary });
});

// GET /claim-cards/:claimCardId/evidence
router.get("/claim-cards/:claimCardId/evidence", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.claimCardId) ? req.params.claimCardId[0] : req.params.claimCardId;
  const claimCardId = parseInt(raw, 10);
  if (isNaN(claimCardId)) { res.status(400).json({ error: "Invalid claimCardId" }); return; }
  const rows = await db.select().from(evidenceTable).where(eq(evidenceTable.claimCardId, claimCardId));
  res.json(await Promise.all(rows.map(formatEvidence)));
});

// POST /claim-cards/:claimCardId/evidence
router.post("/claim-cards/:claimCardId/evidence", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.claimCardId) ? req.params.claimCardId[0] : req.params.claimCardId;
  const claimCardId = parseInt(raw, 10);
  if (isNaN(claimCardId)) { res.status(400).json({ error: "Invalid claimCardId" }); return; }
  const parsed = AddEvidenceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(evidenceTable).values({ claimCardId, ...parsed.data }).returning();
  res.status(201).json(await formatEvidence(row));
});

// DELETE /claim-cards/:claimCardId/evidence/:id
router.delete("/claim-cards/:claimCardId/evidence/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(evidenceTable).where(eq(evidenceTable.id, id));
  res.status(204).send();
});

export default router;
