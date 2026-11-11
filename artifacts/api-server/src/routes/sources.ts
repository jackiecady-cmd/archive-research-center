import { Router } from "express";
import { eq, ilike, and, or, gte, lte, sql } from "drizzle-orm";
import { db, sourcesTable, collectionsTable, repositoriesTable } from "@workspace/db";
import {
  ListSourcesQueryParams,
  CreateSourceBody,
  UpdateSourceBody,
} from "@workspace/api-zod";

const router = Router();

// Helper: format a source row for the API response
type RepositoryRow = typeof repositoriesTable.$inferSelect;

function formatRepository(repository?: RepositoryRow | null) {
  if (!repository) return null;
  return {
    id: repository.id,
    name: repository.name,
    slug: repository.slug,
    url: repository.url,
    institutionType: repository.institutionType,
  };
}

function formatSource(
  row: typeof sourcesTable.$inferSelect,
  collectionName?: string | null,
  repository?: RepositoryRow | null,
) {
  return {
    id: row.id,
    title: row.title,
    sourceType: row.sourceType,
    collectionSlug: row.collectionSlug ?? null,
    collectionName: collectionName ?? null,
    repository: formatRepository(repository),
    repositoryAccessStatus: row.repositoryAccessStatus ?? null,
    repositoryAccessNote: row.repositoryAccessNote ?? null,
    author: row.author ?? null,
    dateLabel: row.dateLabel ?? null,
    language: row.language ?? null,
    originalLanguage: row.originalLanguage ?? null,
    provenance: row.provenance,
    confidence: row.confidence,
    chronology: row.chronology ?? null,
    availability: row.availability,
    rightsStatement: row.rightsStatement ?? null,
    description: row.description ?? null,
    excerpt: row.excerpt ?? null,
    originalLanguageText: row.originalLanguageText ?? null,
    externalUrl: row.externalUrl ?? null,
    tags: row.tags,
    yearApprox: row.yearApprox ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /sources
router.get("/sources", async (req, res): Promise<void> => {
  const params = ListSourcesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const {
    q, collection, repository, repositoryAccess, type, language, confidence, availability,
    page = 1, limit = 20, yearFrom, yearTo,
  } = params.data;

  const conditions = [];

  // Full-text search across title, description, and excerpt (OR logic)
  if (q) {
    conditions.push(
      or(
        ilike(sourcesTable.title, `%${q}%`),
        ilike(sourcesTable.description, `%${q}%`),
        ilike(sourcesTable.excerpt, `%${q}%`),
      )!
    );
  }

  if (collection) conditions.push(eq(sourcesTable.collectionSlug, collection));
  if (repository) {
    const [repositoryRow] = await db
      .select({ id: repositoriesTable.id })
      .from(repositoriesTable)
      .where(eq(repositoriesTable.slug, repository));
    conditions.push(
      repositoryRow
        ? eq(sourcesTable.repositoryId, repositoryRow.id)
        : sql`false`,
    );
  }
  if (repositoryAccess) {
    conditions.push(eq(sourcesTable.repositoryAccessStatus, repositoryAccess));
  }
  if (type) conditions.push(eq(sourcesTable.sourceType, type));
  if (language) conditions.push(eq(sourcesTable.language, language));
  if (confidence) conditions.push(eq(sourcesTable.confidence, confidence));
  if (availability) conditions.push(eq(sourcesTable.availability, availability));
  if (yearFrom !== undefined) conditions.push(gte(sourcesTable.yearApprox, yearFrom));
  if (yearTo !== undefined) conditions.push(lte(sourcesTable.yearApprox, yearTo));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const offset = (pageNum - 1) * limitNum;

  const [rows, countResult] = await Promise.all([
    db.select().from(sourcesTable).where(where).limit(limitNum).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(sourcesTable).where(where),
  ]);

  // Fetch collection names for matched sources
  const slugs = [...new Set(rows.map((r) => r.collectionSlug).filter(Boolean))] as string[];
  const collections = slugs.length
    ? await db.select().from(collectionsTable).where(sql`${collectionsTable.slug} = ANY(ARRAY[${sql.join(slugs.map(s => sql`${s}`), sql`, `)}]::text[])`)
    : [];
  const collectionMap = Object.fromEntries(collections.map((c) => [c.slug, c.name]));
  const repositoryIds = [...new Set(rows.map((r) => r.repositoryId).filter(Boolean))] as number[];
  const repositories = repositoryIds.length
    ? await db
        .select()
        .from(repositoriesTable)
        .where(sql`${repositoriesTable.id} = ANY(ARRAY[${sql.join(repositoryIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
    : [];
  const repositoryMap = Object.fromEntries(repositories.map((repositoryRow) => [repositoryRow.id, repositoryRow]));

  res.json({
    items: rows.map((r) =>
      formatSource(
        r,
        collectionMap[r.collectionSlug ?? ""],
        r.repositoryId ? repositoryMap[r.repositoryId] : null,
      ),
    ),
    total: countResult[0]?.count ?? 0,
    page: pageNum,
    limit: limitNum,
  });
});

// POST /sources
router.post("/sources", async (req, res): Promise<void> => {
  const parsed = CreateSourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(sourcesTable).values(parsed.data).returning();
  const [repository] = row.repositoryId
    ? await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, row.repositoryId))
    : [];
  res.status(201).json(formatSource(row, null, repository));
});

// GET /sources/stats
router.get("/sources/stats", async (req, res): Promise<void> => {
  const [total, byType, byConfidence, byCollection, byAvailability] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(sourcesTable),
    db.select({ type: sourcesTable.sourceType, count: sql<number>`count(*)::int` }).from(sourcesTable).groupBy(sourcesTable.sourceType),
    db.select({ confidence: sourcesTable.confidence, count: sql<number>`count(*)::int` }).from(sourcesTable).groupBy(sourcesTable.confidence),
    db.select({ collection: sourcesTable.collectionSlug, count: sql<number>`count(*)::int` }).from(sourcesTable).groupBy(sourcesTable.collectionSlug),
    db.select({ availability: sourcesTable.availability, count: sql<number>`count(*)::int` }).from(sourcesTable).groupBy(sourcesTable.availability),
  ]);

  res.json({
    totalSources: total[0]?.count ?? 0,
    byType: byType.map((r) => ({ type: r.type, count: r.count })),
    byConfidence: byConfidence.map((r) => ({ confidence: r.confidence, count: r.count })),
    byCollection: byCollection.filter((r) => r.collection).map((r) => ({ collection: r.collection!, count: r.count })),
    byAvailability: byAvailability.map((r) => ({ availability: r.availability, count: r.count })),
  });
});

// GET /sources/:id
router.get("/sources/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db.select().from(sourcesTable).where(eq(sourcesTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  let collectionName: string | null = null;
  if (row.collectionSlug) {
    const [col] = await db.select().from(collectionsTable).where(eq(collectionsTable.slug, row.collectionSlug));
    collectionName = col?.name ?? null;
  }

  const [repository] = row.repositoryId
    ? await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, row.repositoryId))
    : [];
  res.json(formatSource(row, collectionName, repository));
});

// PATCH /sources/:id — update editable fields (editor workflow)
router.patch("/sources/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateSourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(sourcesTable).where(eq(sourcesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [updated] = await db
    .update(sourcesTable)
    .set(parsed.data)
    .where(eq(sourcesTable.id, id))
    .returning();

  let collectionName: string | null = null;
  if (updated.collectionSlug) {
    const [col] = await db.select().from(collectionsTable).where(eq(collectionsTable.slug, updated.collectionSlug));
    collectionName = col?.name ?? null;
  }

  const [repository] = updated.repositoryId
    ? await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, updated.repositoryId))
    : [];
  res.json(formatSource(updated, collectionName, repository));
});

export default router;
