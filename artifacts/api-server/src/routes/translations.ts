import { Router } from "express";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db, translationsTable, sourcesTable } from "@workspace/db";
import { CreateTranslationBody, UpdateTranslationBody } from "@workspace/api-zod";
import { TRANSLATION_DISCLOSURE } from "@workspace/config";
import { currentUser } from "../auth/middleware";
import { parseIntParam, sendValidationError } from "../lib/http";
import { likeContains, parseListLimit } from "../lib/security";

const router = Router();

const LAYER_FIELDS = [
  "originalText", "transliteration", "morphologyNotes",
  "literalTranslation", "readableTranslation", "publishedTranslation",
  "commentary", "userInterpretation",
] as const;

const LAYER_COLUMNS = [
  translationsTable.originalText,
  translationsTable.transliteration,
  translationsTable.morphologyNotes,
  translationsTable.literalTranslation,
  translationsTable.readableTranslation,
  translationsTable.publishedTranslation,
  translationsTable.commentary,
  translationsTable.userInterpretation,
] as const;

type TRow = typeof translationsTable.$inferSelect;

function formatTranslation(row: TRow) {
  return {
    id: row.id,
    sourceId: row.sourceId,
    originalText: row.originalText ?? null,
    transliteration: row.transliteration ?? null,
    morphologyNotes: row.morphologyNotes ?? null,
    literalTranslation: row.literalTranslation ?? null,
    readableTranslation: row.readableTranslation ?? null,
    publishedTranslation: row.publishedTranslation ?? null,
    publishedTranslationAttribution: row.publishedTranslationAttribution ?? null,
    commentary: row.commentary ?? null,
    userInterpretation: row.userInterpretation ?? null,
    translationDisclosure: TRANSLATION_DISCLOSURE,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function hasContent() {
  return or(...LAYER_COLUMNS.map((column) => sql`length(btrim(coalesce(${column}, ''))) > 0`));
}

router.get("/translations/workspaces", async (req, res): Promise<void> => {
  const user = currentUser(req);
  if (!user) { res.status(401).json({ error: "Authentication required" }); return; }
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const limit = parseListLimit(req.query.limit, 20);
  if (limit === null) {
    res.status(400).json({
      error: "Validation failed",
      formErrors: [],
      fieldErrors: { limit: ["limit must be an integer from 1 to 50"] },
    });
    return;
  }

  const filters = [eq(translationsTable.userId, user.id), hasContent()];
  if (q) {
    const pattern = likeContains(q);
    filters.push(or(...LAYER_COLUMNS.map((column) => ilike(column, pattern))));
  }

  const limited = await db
    .select()
    .from(translationsTable)
    .where(and(...filters))
    .orderBy(desc(translationsTable.updatedAt))
    .limit(limit);

  if (limited.length === 0) {
    res.json([]);
    return;
  }

  const sourceIds = [...new Set(limited.map((workspace) => workspace.sourceId))];
  const sources = await db.select().from(sourcesTable).where(inArray(sourcesTable.id, sourceIds));
  const srcMap = new Map(sources.map((source) => [source.id, source]));
  const previewPriority = ["readableTranslation", "literalTranslation", "commentary", "originalText"] as const;

  res.json(limited.map((workspace) => {
    const src = srcMap.get(workspace.sourceId);
    const filledLayerCount = LAYER_FIELDS.filter((field) => workspace[field]?.trim()).length;
    const preview = previewPriority.map((field) => workspace[field]).find((value) => value?.trim()) ?? null;
    return {
      id: workspace.id,
      sourceId: workspace.sourceId,
      sourceTitle: src?.title ?? "Unknown Source",
      sourceAuthor: src?.author ?? null,
      sourceDateLabel: src?.dateLabel ?? null,
      sourceLanguage: src?.language ?? null,
      sourceCollectionSlug: src?.collectionSlug ?? null,
      filledLayerCount,
      preview: preview ? preview.slice(0, 240) : null,
      translationDisclosure: TRANSLATION_DISCLOSURE,
      updatedAt: workspace.updatedAt.toISOString(),
    };
  }));
});

router.get("/translations", async (req, res): Promise<void> => {
  const user = currentUser(req);
  if (!user) { res.status(401).json({ error: "Authentication required" }); return; }
  const sourceId = Number(req.query.sourceId);
  if (!Number.isInteger(sourceId) || sourceId <= 0) {
    res.status(400).json({ error: "sourceId query parameter is required" });
    return;
  }
  const [existing] = await db
    .select()
    .from(translationsTable)
    .where(and(eq(translationsTable.userId, user.id), eq(translationsTable.sourceId, sourceId)))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "Translation workspace not found" });
    return;
  }
  res.json(formatTranslation(existing));
});

router.post("/translations", async (req, res): Promise<void> => {
  const user = currentUser(req);
  if (!user) { res.status(401).json({ error: "Authentication required" }); return; }
  const parsed = CreateTranslationBody.safeParse(req.body);
  if (!parsed.success) { sendValidationError(res, parsed.error); return; }
  const { sourceId } = parsed.data;
  const [source] = await db.select({ id: sourcesTable.id }).from(sourcesTable).where(eq(sourcesTable.id, sourceId));
  if (!source) {
    res.status(400).json({ error: "Validation failed", formErrors: [], fieldErrors: { sourceId: ["Source not found"] } });
    return;
  }

  const inserted = await db
    .insert(translationsTable)
    .values({ sourceId, userId: user.id })
    .onConflictDoNothing({ target: [translationsTable.userId, translationsTable.sourceId] })
    .returning();
  if (inserted[0]) {
    res.status(201).json(formatTranslation(inserted[0]));
    return;
  }
  const [existing] = await db
    .select()
    .from(translationsTable)
    .where(and(eq(translationsTable.userId, user.id), eq(translationsTable.sourceId, sourceId)))
    .limit(1);
  if (!existing) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
  res.json(formatTranslation(existing));
});

router.patch("/translations/:id", async (req, res): Promise<void> => {
  const user = currentUser(req);
  if (!user) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = UpdateTranslationBody.safeParse(req.body);
  if (!body.success) {
    sendValidationError(res, body.error);
    return;
  }
  const updated = await db
    .update(translationsTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(and(eq(translationsTable.id, id), eq(translationsTable.userId, user.id)))
    .returning();
  if (!updated[0]) {
    res.status(404).json({ error: "Translation workspace not found" });
    return;
  }
  res.json(formatTranslation(updated[0]));
});

export default router;
