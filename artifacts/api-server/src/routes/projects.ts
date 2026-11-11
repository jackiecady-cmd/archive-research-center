import { Router, type Request, type Response } from "express";
import { eq, and, sql } from "drizzle-orm";
import {
  db,
  researchProjectsTable,
  savedSourcesTable,
  notesTable,
  claimCardsTable,
  sourcesTable,
  evidenceTable,
} from "@workspace/db";
import { publicSourceType } from "../lib/source-type";
import {
  CreateResearchProjectBody,
  UpdateResearchProjectBody,
  CreateNoteBody,
  UpdateNoteBody,
  SaveSourceBody,
} from "@workspace/api-zod";
import { currentUser } from "../auth/middleware";
import { ownedBy, whereAll } from "../auth/ownership";
import { parseIntParam, sendValidationError } from "../lib/http";
import type { SessionUser } from "../auth/session";

const router = Router();

function requireSession(req: Request, res: Response): SessionUser | null {
  const user = currentUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return user;
}

async function findOwnedProject(id: number, user: SessionUser) {
  const [project] = await db
    .select()
    .from(researchProjectsTable)
    .where(whereAll(eq(researchProjectsTable.id, id), ownedBy(user, researchProjectsTable.userId)));
  return project;
}

async function getProjectCounts(projectId: number) {
  const [sc, nc, cc] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(savedSourcesTable).where(eq(savedSourcesTable.projectId, projectId)),
    db.select({ count: sql<number>`count(*)::int` }).from(notesTable).where(eq(notesTable.projectId, projectId)),
    db.select({ count: sql<number>`count(*)::int` }).from(claimCardsTable).where(eq(claimCardsTable.projectId, projectId)),
  ]);
  return {
    sourceCount: sc[0]?.count ?? 0,
    noteCount: nc[0]?.count ?? 0,
    claimCount: cc[0]?.count ?? 0,
  };
}

function formatProject(row: typeof researchProjectsTable.$inferSelect, counts = { sourceCount: 0, noteCount: 0, claimCount: 0 }) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    researcherType: row.researcherType ?? null,
    sourceCount: counts.sourceCount,
    noteCount: counts.noteCount,
    claimCount: counts.claimCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /research-projects
router.get("/research-projects", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const rows = await db
    .select()
    .from(researchProjectsTable)
    .where(ownedBy(user, researchProjectsTable.userId))
    .orderBy(researchProjectsTable.updatedAt);
  const formatted = await Promise.all(rows.map(async (row) => {
    const counts = await getProjectCounts(row.id);
    return formatProject(row, counts);
  }));
  res.json(formatted);
});

// POST /research-projects
router.post("/research-projects", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const parsed = CreateResearchProjectBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const [row] = await db
    .insert(researchProjectsTable)
    .values({ ...parsed.data, userId: user.id })
    .returning();
  res.status(201).json(formatProject(row));
});

// GET /research-projects/:id
router.get("/research-projects/:id", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const project = await findOwnedProject(id, user);
  if (!project) { res.status(404).json({ error: "Not found" }); return; }

  const [savedRows, noteRows, claimRows] = await Promise.all([
    db.select().from(savedSourcesTable).where(eq(savedSourcesTable.projectId, id)),
    db.select().from(notesTable).where(eq(notesTable.projectId, id)),
    db.select().from(claimCardsTable).where(eq(claimCardsTable.projectId, id)),
  ]);

  // Fetch real evidence counts for each claim card
  const claimIds = claimRows.map((c) => c.id);
  const evidenceCounts: Record<number, number> = {};
  if (claimIds.length) {
    const counts = await db
      .select({ claimCardId: evidenceTable.claimCardId, count: sql<number>`count(*)::int` })
      .from(evidenceTable)
      .where(sql`${evidenceTable.claimCardId} = ANY(ARRAY[${sql.join(claimIds.map((cid) => sql`${cid}`), sql`, `)}]::int[])`)
      .groupBy(evidenceTable.claimCardId);
    for (const c of counts) evidenceCounts[c.claimCardId] = c.count;
  }

  // Load sources for saved sources
  const sourceIds = savedRows.map((r) => r.sourceId);
  const sourceRows = sourceIds.length
    ? await db.select().from(sourcesTable).where(sql`${sourcesTable.id} = ANY(ARRAY[${sql.join(sourceIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
    : [];
  const sourceMap = Object.fromEntries(sourceRows.map((s) => [s.id, s]));

  const savedSources = savedRows.map((ss) => {
    const src = sourceMap[ss.sourceId];
    return {
      id: ss.id,
      projectId: ss.projectId,
      sourceId: ss.sourceId,
      source: src ? {
        id: src.id, title: src.title, sourceType: publicSourceType(src.sourceType),
        collectionSlug: src.collectionSlug ?? null, collectionName: null,
        author: src.author ?? null, dateLabel: src.dateLabel ?? null,
        language: src.language ?? null, originalLanguage: src.originalLanguage ?? null,
        provenance: src.provenance, confidence: src.confidence,
        chronology: src.chronology ?? null, availability: src.availability,
        rightsStatement: src.rightsStatement ?? null, description: src.description ?? null,
        excerpt: src.excerpt ?? null, externalUrl: src.externalUrl ?? null,
        tags: src.tags, createdAt: src.createdAt.toISOString(),
      } : undefined,
      userNotes: ss.userNotes ?? null,
      addedAt: ss.addedAt.toISOString(),
    };
  });

  const notes = noteRows.map((n) => ({
    id: n.id, projectId: n.projectId, title: n.title, content: n.content,
    createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString(),
  }));

  const claimCards = claimRows.map((c) => ({
    id: c.id, title: c.title, claim: c.claim, status: c.status,
    projectId: c.projectId ?? null, evidenceCount: evidenceCounts[c.id] ?? 0,
    createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(),
  }));

  res.json({
    project: formatProject(project, {
      sourceCount: savedSources.length,
      noteCount: notes.length,
      claimCount: claimCards.length,
    }),
    savedSources,
    notes,
    claimCards,
  });
});

// PATCH /research-projects/:id
router.patch("/research-projects/:id", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateResearchProjectBody.safeParse(req.body);
  if (!parsed.success) { sendValidationError(res, parsed.error); return; }

  const [updated] = await db
    .update(researchProjectsTable)
    .set(parsed.data)
    .where(whereAll(eq(researchProjectsTable.id, id), ownedBy(user, researchProjectsTable.userId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  const counts = await getProjectCounts(id);
  res.json(formatProject(updated, counts));
});

// DELETE /research-projects/:id
router.delete("/research-projects/:id", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const deleted = await db
    .delete(researchProjectsTable)
    .where(whereAll(eq(researchProjectsTable.id, id), ownedBy(user, researchProjectsTable.userId)))
    .returning({ id: researchProjectsTable.id });
  if (!deleted.length) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).send();
});

// GET /research-projects/:projectId/saved-sources
router.get("/research-projects/:projectId/saved-sources", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const projectId = parseIntParam(req.params.projectId);
  if (projectId === null) { res.status(400).json({ error: "Invalid projectId" }); return; }
  const project = await findOwnedProject(projectId, user);
  if (!project) { res.status(404).json({ error: "Not found" }); return; }
  const rows = await db.select().from(savedSourcesTable).where(eq(savedSourcesTable.projectId, projectId));
  const sourceIds = rows.map((r) => r.sourceId);
  const sourceRows = sourceIds.length
    ? await db.select().from(sourcesTable).where(sql`${sourcesTable.id} = ANY(ARRAY[${sql.join(sourceIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
    : [];
  const sourceMap = Object.fromEntries(sourceRows.map((s) => [s.id, s]));
  res.json(rows.map((ss) => {
    const src = sourceMap[ss.sourceId];
    return {
      id: ss.id, projectId: ss.projectId, sourceId: ss.sourceId,
      source: src ? { id: src.id, title: src.title, sourceType: publicSourceType(src.sourceType),
        collectionSlug: src.collectionSlug ?? null, collectionName: null,
        author: src.author ?? null, dateLabel: src.dateLabel ?? null,
        language: src.language ?? null, originalLanguage: src.originalLanguage ?? null,
        provenance: src.provenance, confidence: src.confidence,
        chronology: src.chronology ?? null, availability: src.availability,
        rightsStatement: src.rightsStatement ?? null, description: src.description ?? null,
        excerpt: src.excerpt ?? null, externalUrl: src.externalUrl ?? null,
        tags: src.tags, createdAt: src.createdAt.toISOString() } : undefined,
      userNotes: ss.userNotes ?? null,
      addedAt: ss.addedAt.toISOString(),
    };
  }));
});

// POST /research-projects/:projectId/saved-sources
router.post("/research-projects/:projectId/saved-sources", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const projectId = parseIntParam(req.params.projectId);
  if (projectId === null) { res.status(400).json({ error: "Invalid projectId" }); return; }
  const project = await findOwnedProject(projectId, user);
  if (!project) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = SaveSourceBody.safeParse(req.body);
  if (!parsed.success) { sendValidationError(res, parsed.error); return; }
  const [source] = await db.select({ id: sourcesTable.id }).from(sourcesTable).where(eq(sourcesTable.id, parsed.data.sourceId));
  if (!source) {
    res.status(400).json({ error: "Validation failed", formErrors: [], fieldErrors: { sourceId: ["Source not found"] } });
    return;
  }
  const [row] = await db.insert(savedSourcesTable).values({
    projectId,
    sourceId: parsed.data.sourceId,
    userNotes: parsed.data.userNotes,
    userId: user.id,
  }).returning();
  const [src] = await db.select().from(sourcesTable).where(eq(sourcesTable.id, row.sourceId));
  res.status(201).json({
    id: row.id, projectId: row.projectId, sourceId: row.sourceId,
    source: src ? { id: src.id, title: src.title, sourceType: publicSourceType(src.sourceType),
      collectionSlug: src.collectionSlug ?? null, collectionName: null,
      author: src.author ?? null, dateLabel: src.dateLabel ?? null,
      language: src.language ?? null, originalLanguage: src.originalLanguage ?? null,
      provenance: src.provenance, confidence: src.confidence,
      chronology: src.chronology ?? null, availability: src.availability,
      rightsStatement: src.rightsStatement ?? null, description: src.description ?? null,
      excerpt: src.excerpt ?? null, externalUrl: src.externalUrl ?? null,
      tags: src.tags, createdAt: src.createdAt.toISOString() } : undefined,
    userNotes: row.userNotes ?? null,
    addedAt: row.addedAt.toISOString(),
  });
});

// DELETE /research-projects/:projectId/saved-sources/:id
router.delete("/research-projects/:projectId/saved-sources/:id", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const projectId = parseIntParam(req.params.projectId);
  const id = parseIntParam(req.params.id);
  if (projectId === null || id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const project = await findOwnedProject(projectId, user);
  if (!project) { res.status(404).json({ error: "Not found" }); return; }
  const deleted = await db
    .delete(savedSourcesTable)
    .where(and(eq(savedSourcesTable.id, id), eq(savedSourcesTable.projectId, projectId)))
    .returning({ id: savedSourcesTable.id });
  if (!deleted.length) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).send();
});

// GET /research-projects/:projectId/notes
router.get("/research-projects/:projectId/notes", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const projectId = parseIntParam(req.params.projectId);
  if (projectId === null) { res.status(400).json({ error: "Invalid projectId" }); return; }
  const project = await findOwnedProject(projectId, user);
  if (!project) { res.status(404).json({ error: "Not found" }); return; }
  const rows = await db.select().from(notesTable).where(eq(notesTable.projectId, projectId));
  res.json(rows.map((n) => ({
    id: n.id, projectId: n.projectId, title: n.title, content: n.content,
    createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString(),
  })));
});

// POST /research-projects/:projectId/notes
router.post("/research-projects/:projectId/notes", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const projectId = parseIntParam(req.params.projectId);
  if (projectId === null) { res.status(400).json({ error: "Invalid projectId" }); return; }
  const project = await findOwnedProject(projectId, user);
  if (!project) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) { sendValidationError(res, parsed.error); return; }
  const [row] = await db.insert(notesTable).values({
    projectId,
    userId: user.id,
    title: parsed.data.title,
    content: parsed.data.content,
  }).returning();
  res.status(201).json({ id: row.id, projectId: row.projectId, title: row.title, content: row.content,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
});

// PATCH /research-projects/:projectId/notes/:id
router.patch("/research-projects/:projectId/notes/:id", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const projectId = parseIntParam(req.params.projectId);
  const id = parseIntParam(req.params.id);
  if (projectId === null || id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const project = await findOwnedProject(projectId, user);
  if (!project) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = UpdateNoteBody.safeParse(req.body);
  if (!parsed.success) { sendValidationError(res, parsed.error); return; }
  const patch: { title?: string; content?: string } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.content !== undefined) patch.content = parsed.data.content;
  const [updated] = await db
    .update(notesTable)
    .set(patch)
    .where(and(eq(notesTable.id, id), eq(notesTable.projectId, projectId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: updated.id, projectId: updated.projectId, title: updated.title, content: updated.content,
    createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
});

// DELETE /research-projects/:projectId/notes/:id
router.delete("/research-projects/:projectId/notes/:id", async (req, res): Promise<void> => {
  const user = requireSession(req, res);
  if (!user) return;
  const projectId = parseIntParam(req.params.projectId);
  const id = parseIntParam(req.params.id);
  if (projectId === null || id === null) { res.status(400).json({ error: "Invalid id" }); return; }
  const project = await findOwnedProject(projectId, user);
  if (!project) { res.status(404).json({ error: "Not found" }); return; }
  const deleted = await db
    .delete(notesTable)
    .where(and(eq(notesTable.id, id), eq(notesTable.projectId, projectId)))
    .returning({ id: notesTable.id });
  if (!deleted.length) { res.status(404).json({ error: "Not found" }); return; }
  res.status(204).send();
});

export default router;
