import { Router } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, claimCardsTable, evidenceTable, sourcesTable, researchProjectsTable } from "@workspace/db";
import {
  CreateClaimCardBody,
  UpdateClaimCardBody,
  AddEvidenceBody,
} from "@workspace/api-zod";
import { currentUser } from "../auth/middleware";
import { ownedBy, whereAll } from "../auth/ownership";
import type { SessionUser } from "../auth/session";
import { parseIntParam, sendValidationError } from "../lib/http";
import { TRANSLATION_DISCLOSURE } from "@workspace/config";
import { publicSourceType } from "../lib/source-type";

const router = Router();

function requireSession(req: Parameters<typeof currentUser>[0], res: { status: (code: number) => { json: (body: unknown) => void } }): SessionUser | null {
  const user = currentUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return user;
}

async function findOwnedClaim(id: number, user: SessionUser) {
  const [row] = await db
    .select()
    .from(claimCardsTable)
    .where(whereAll(eq(claimCardsTable.id, id), ownedBy(user, claimCardsTable.userId)));
  return row;
}

async function projectAllowed(projectId: number | null | undefined, user: SessionUser): Promise<boolean> {
  if (projectId == null) return true;
  const [project] = await db
    .select({ id: researchProjectsTable.id })
    .from(researchProjectsTable)
    .where(whereAll(eq(researchProjectsTable.id, projectId), ownedBy(user, researchProjectsTable.userId)));
  return Boolean(project);
}

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
      id: src.id, title: src.title, sourceType: publicSourceType(src.sourceType),
      collectionSlug: src.collectionSlug ?? null, collectionName: null,
      author: src.author ?? null, dateLabel: src.dateLabel ?? null,
      language: src.language ?? null, originalLanguage: src.originalLanguage ?? null,
      provenance: src.provenance, confidence: src.confidence,
      chronology: src.chronology ?? null, availability: src.availability,
      rightsStatement: src.rightsStatement ?? null, description: src.description ?? null,
      excerpt: src.excerpt ?? null, translationDisclosure: TRANSLATION_DISCLOSURE, externalUrl: src.externalUrl ?? null,
      tags: src.tags, createdAt: src.createdAt.toISOString(),
    } : undefined,
    role: row.role,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /claim-cards
router.get("/claim-cards", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  let projectId: number | undefined;
  if (typeof req.query.projectId === "string" && req.query.projectId !== "") {
    const parsedProjectId = parseIntParam(req.query.projectId);
    if (parsedProjectId === null) { res.status(400).json({ error: "Invalid projectId" }); return; }
    if (!(await projectAllowed(parsedProjectId, user))) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    projectId = parsedProjectId;
  }
  const rows = await db.select().from(claimCardsTable).where(whereAll(
    ownedBy(user, claimCardsTable.userId),
    projectId === undefined ? undefined : eq(claimCardsTable.projectId, projectId),
  ));
  const formatted = await Promise.all(rows.map(formatClaimCard));
  res.json(formatted);
});

// POST /claim-cards
router.post("/claim-cards", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const parsed = CreateClaimCardBody.safeParse(req.body);
  if (!parsed.success) { sendValidationError(res, parsed.error); return; }
  if (!(await projectAllowed(parsed.data.projectId, user))) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [row] = await db.insert(claimCardsTable).values({ ...parsed.data, userId: user.id }).returning();
  res.status(201).json(await formatClaimCard(row));
});

// GET /claim-cards/:id
router.get("/claim-cards/:id", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const row = await findOwnedClaim(id, user);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatClaimCard(row));
});

// PATCH /claim-cards/:id
router.patch("/claim-cards/:id", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateClaimCardBody.safeParse(req.body);
  if (!parsed.success) { sendValidationError(res, parsed.error); return; }
  const existing = await findOwnedClaim(id, user);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db
    .update(claimCardsTable)
    .set(parsed.data)
    .where(whereAll(eq(claimCardsTable.id, id), ownedBy(user, claimCardsTable.userId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatClaimCard(updated));
});

// GET /claim-cards/:id/evidence-trail
router.get("/claim-cards/:id/evidence-trail", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const card = await findOwnedClaim(id, user);
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
  const user = requireSession(req, res);
  if (!user) return;
  const claimCardId = parseIntParam(req.params.claimCardId);
  if (claimCardId === null) { res.status(400).json({ error: "Invalid claimCardId" }); return; }
  const card = await findOwnedClaim(claimCardId, user);
  if (!card) { res.status(404).json({ error: "Not found" }); return; }
  const rows = await db.select().from(evidenceTable).where(eq(evidenceTable.claimCardId, claimCardId));
  res.json(await Promise.all(rows.map(formatEvidence)));
});

// POST /claim-cards/:claimCardId/evidence
router.post("/claim-cards/:claimCardId/evidence", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const claimCardId = parseIntParam(req.params.claimCardId);
  if (claimCardId === null) { res.status(400).json({ error: "Invalid claimCardId" }); return; }
  const card = await findOwnedClaim(claimCardId, user);
  if (!card) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = AddEvidenceBody.safeParse(req.body);
  if (!parsed.success) { sendValidationError(res, parsed.error); return; }
  const [source] = await db.select({ id: sourcesTable.id }).from(sourcesTable).where(eq(sourcesTable.id, parsed.data.sourceId));
  if (!source) {
    res.status(400).json({ error: "Validation failed", formErrors: [], fieldErrors: { sourceId: ["Source not found"] } });
    return;
  }
  const [row] = await db.insert(evidenceTable).values({
    claimCardId,
    userId: user.id,
    sourceId: parsed.data.sourceId,
    role: parsed.data.role,
    summary: parsed.data.summary,
  }).returning();
  res.status(201).json(await formatEvidence(row));
});

// DELETE /claim-cards/:claimCardId/evidence/:id
router.delete("/claim-cards/:claimCardId/evidence/:id", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const claimCardId = parseIntParam(req.params.claimCardId);
  const id = parseIntParam(req.params.id);
  if (claimCardId === null || id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const card = await findOwnedClaim(claimCardId, user);
  if (!card) { res.status(404).json({ error: "Not found" }); return; }
  const deleted = await db
    .delete(evidenceTable)
    .where(and(eq(evidenceTable.id, id), eq(evidenceTable.claimCardId, claimCardId)))
    .returning({ id: evidenceTable.id });
  if (!deleted.length) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).send();
});

export default router;
