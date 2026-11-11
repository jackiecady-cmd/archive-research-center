import { Router } from "express";
import { eq, ilike, and, or, gte, lte, sql } from "drizzle-orm";
import { db, sourcesTable, collectionsTable, repositoriesTable } from "@workspace/db";
import {
  ListSourcesQueryParams,
  CreateSourceBody,
  UpdateSourceBody,
} from "@workspace/api-zod";
import { requireEditor } from "../auth/middleware";
import { sendValidationError } from "../lib/http";
import { likeContains, parseListLimit, parseListPage } from "../lib/security";
import { TRANSLATION_DISCLOSURE } from "@workspace/config";
import { isCitationOnly } from "@workspace/config/legal";
import { visibleExcerpt, visibleOriginalText } from "../lib/holding";
import { publicSourceType } from "../lib/source-type";

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
    sourceType: publicSourceType(row.sourceType),
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
    excerpt: visibleExcerpt(row),
    translationDisclosure: TRANSLATION_DISCLOSURE,
    originalLanguageText: visibleOriginalText(row),
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
    sendValidationError(res, params.error);
    return;
  }
  const {
    q, collection, repository, repositoryAccess, type, language, confidence, availability,
    page = 1, limit = 20, yearFrom, yearTo,
  } = params.data;

  const conditions = [];

  // Citation-only, CDLI, and CC BY-NC records match title and citation fields only.
  // Excerpt and original-language text are not searchable, so a hit cannot confirm hidden text.
  if (q) {
    const pattern = likeContains(q);
    const note = sql`lower(concat_ws(' ', ${sourcesTable.rightsStatement}, ${sourcesTable.description}, ${sourcesTable.provenance}, ${sourcesTable.externalUrl}))`;
    const hiddenSourceText = sql`(
      lower(replace(coalesce(${sourcesTable.availability}, ''), '_', '-')) in ('restricted', 'blocked', 'catalog-only', 'reference-only', 'link-only')
      OR lower(replace(coalesce(${sourcesTable.repositoryAccessStatus}, ''), '_', '-')) in ('restricted', 'blocked', 'catalog-only', 'reference-only', 'link-only')
      OR ${note} ~ 'link-only|reference-only|catalogue reference only|catalog reference only|catalog-only|catalogue-only|\\mcdli\\M|cuneiform digital library'
      OR (${note} ~ 'cc[[:space:]]*by-nc|by-nc' AND ${note} !~ 'omitted|no manuscript image|no image|no photograph|not included')
    )`;
    conditions.push(
      or(
        ilike(sourcesTable.title, pattern),
        ilike(sourcesTable.author, pattern),
        ilike(sourcesTable.dateLabel, pattern),
        ilike(sourcesTable.provenance, pattern),
        ilike(sourcesTable.rightsStatement, pattern),
        ilike(sourcesTable.externalUrl, pattern),
        and(
          sql`NOT ${hiddenSourceText}`,
          or(
            ilike(sourcesTable.description, pattern),
            ilike(sourcesTable.excerpt, pattern),
            ilike(sourcesTable.originalLanguageText, pattern),
          ),
        ),
      )!,
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
  const pageNum = parseListPage(page);
  const limitNum = parseListLimit(limit, 20);
  if (pageNum === null || limitNum === null) {
    res.status(400).json({
      error: "Validation failed",
      formErrors: [],
      fieldErrors: {
        ...(pageNum === null ? { page: ["page must be an integer greater than or equal to 1"] } : {}),
        ...(limitNum === null ? { limit: ["limit must be an integer from 1 to 50"] } : {}),
      },
    });
    return;
  }
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
router.post("/sources", requireEditor, async (req, res): Promise<void> => {
  const parsed = CreateSourceBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
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
    byType: [...byType.reduce((counts, row) => {
      const type = publicSourceType(row.type);
      counts.set(type, (counts.get(type) ?? 0) + row.count);
      return counts;
    }, new Map<string, number>())].map(([type, count]) => ({ type, count })),
    byConfidence: byConfidence.map((r) => ({ confidence: r.confidence, count: r.count })),
    byCollection: byCollection.filter((r) => r.collection).map((r) => ({ collection: r.collection!, count: r.count })),
    byAvailability: byAvailability.map((r) => ({ availability: r.availability, count: r.count })),
  });
});

router.get("/sources/:id/export", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db.select().from(sourcesTable).where(eq(sourcesTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const citationOnly = isCitationOnly(row);
  const citation = {
    citationOnly,
    title: row.title,
    author: row.author ?? null,
    dateLabel: row.dateLabel ?? null,
    provenance: row.provenance,
    rightsStatement: row.rightsStatement ?? null,
    externalUrl: row.externalUrl ?? null,
    availability: row.availability,
    repositoryAccessStatus: row.repositoryAccessStatus ?? null,
  };
  if (citationOnly) {
    res.json(citation);
    return;
  }
  res.json({
    ...citation,
    excerpt: visibleExcerpt(row),
    originalLanguageText: visibleOriginalText(row),
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
router.patch("/sources/:id", requireEditor, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateSourceBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
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
