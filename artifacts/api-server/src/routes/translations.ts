import { Router } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, translationsTable, sourcesTable } from "@workspace/db";
import { UpdateTranslationBody } from "@workspace/api-zod";

const router = Router();

const LAYER_FIELDS = [
  "originalText", "transliteration", "morphologyNotes",
  "literalTranslation", "readableTranslation", "publishedTranslation",
  "commentary", "userInterpretation", "aiAssistance",
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
    aiAssistance: row.aiAssistance ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /translations/workspaces?q=&limit=
// List workspaces that have content; optionally search across all text layers
router.get("/translations/workspaces", async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const allRows = await db.select().from(translationsTable);

  // Keep only rows that have at least one non-empty layer
  let filtered = allRows.filter((row) =>
    LAYER_FIELDS.some((f) => (row[f] as string | null)?.trim())
  );

  // Text search across all layers
  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter((row) =>
      LAYER_FIELDS.some((f) => (row[f] as string | null)?.toLowerCase().includes(lower))
    );
  }

  // Sort by most-recently-updated first
  filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const limited = filtered.slice(0, limit);

  if (limited.length === 0) {
    res.json([]);
    return;
  }

  // Fetch source records for the matched workspaces
  const sourceIds = [...new Set(limited.map((w) => w.sourceId))];
  const sources = await db
    .select()
    .from(sourcesTable)
    .where(inArray(sourcesTable.id, sourceIds));
  const srcMap = new Map(sources.map((s) => [s.id, s]));

  const PREVIEW_PRIORITY = ["readableTranslation", "literalTranslation", "commentary", "originalText"] as const;

  const result = limited.map((w) => {
    const src = srcMap.get(w.sourceId);
    const filledLayerCount = LAYER_FIELDS.filter((f) => (w[f] as string | null)?.trim()).length;
    const preview =
      PREVIEW_PRIORITY.map((f) => w[f]).find((v) => v?.trim()) ?? null;

    return {
      id: w.id,
      sourceId: w.sourceId,
      sourceTitle: src?.title ?? "Unknown Source",
      sourceAuthor: src?.author ?? null,
      sourceDateLabel: src?.dateLabel ?? null,
      sourceLanguage: src?.language ?? null,
      sourceCollectionSlug: src?.collectionSlug ?? null,
      filledLayerCount,
      preview: preview ? preview.slice(0, 240) : null,
      updatedAt: w.updatedAt.toISOString(),
    };
  });

  res.json(result);
});

// GET /translations?sourceId=:id  — get or auto-create a workspace
router.get("/translations", async (req, res): Promise<void> => {
  const sourceId = Number(req.query.sourceId);
  if (!sourceId || isNaN(sourceId)) {
    res.status(400).json({ error: "sourceId query parameter is required" });
    return;
  }
  const existing = await db
    .select()
    .from(translationsTable)
    .where(eq(translationsTable.sourceId, sourceId))
    .limit(1);
  if (existing[0]) {
    res.json(formatTranslation(existing[0]));
    return;
  }
  const created = await db
    .insert(translationsTable)
    .values({ sourceId })
    .returning();
  res.json(formatTranslation(created[0]));
});

// PATCH /translations/:id  — save one or more layers
router.patch("/translations/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = UpdateTranslationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const updated = await db
    .update(translationsTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(translationsTable.id, id))
    .returning();
  if (!updated[0]) {
    res.status(404).json({ error: "Translation workspace not found" });
    return;
  }
  res.json(formatTranslation(updated[0]));
});

export default router;
