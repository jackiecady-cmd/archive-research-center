import { Router } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, repositoriesTable, sourcesTable } from "@workspace/db";
import { publicSourceType } from "../lib/source-type";

const router = Router();

function formatRepository(
  row: typeof repositoriesTable.$inferSelect,
  sourceCount = 0,
) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    url: row.url,
    institutionType: row.institutionType,
    sourceCount,
  };
}

function formatSource(
  source: typeof sourcesTable.$inferSelect,
  repository: typeof repositoriesTable.$inferSelect,
) {
  return {
    id: source.id,
    title: source.title,
    sourceType: publicSourceType(source.sourceType),
    collectionSlug: source.collectionSlug ?? null,
    collectionName: null,
    repository: {
      id: repository.id,
      name: repository.name,
      slug: repository.slug,
      url: repository.url,
      institutionType: repository.institutionType,
    },
    repositoryAccessStatus: source.repositoryAccessStatus ?? null,
    repositoryAccessNote: source.repositoryAccessNote ?? null,
    author: source.author ?? null,
    dateLabel: source.dateLabel ?? null,
    language: source.language ?? null,
    originalLanguage: source.originalLanguage ?? null,
    provenance: source.provenance,
    confidence: source.confidence,
    chronology: source.chronology ?? null,
    availability: source.availability,
    rightsStatement: source.rightsStatement ?? null,
    description: source.description ?? null,
    excerpt: source.excerpt ?? null,
    originalLanguageText: source.originalLanguageText ?? null,
    externalUrl: source.externalUrl ?? null,
    tags: source.tags,
    yearApprox: source.yearApprox ?? null,
    createdAt: source.createdAt.toISOString(),
  };
}

router.get("/repositories", async (_req, res): Promise<void> => {
  const repositories = await db
    .select()
    .from(repositoriesTable)
    .orderBy(desc(repositoriesTable.createdAt));
  const countRows = await db
    .select({
      repositoryId: sourcesTable.repositoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(sourcesTable)
    .groupBy(sourcesTable.repositoryId);
  const counts = new Map<number, number>();
  for (const row of countRows) {
    if (row.repositoryId) counts.set(row.repositoryId, row.count);
  }
  res.json(
    repositories.map((repository) =>
      formatRepository(repository, counts.get(repository.id) ?? 0),
    ),
  );
});

router.get("/repositories/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [repository] = await db
    .select()
    .from(repositoriesTable)
    .where(eq(repositoriesTable.slug, slug));
  if (!repository) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const sources = await db
    .select()
    .from(sourcesTable)
    .where(eq(sourcesTable.repositoryId, repository.id));
  res.json({
    repository: formatRepository(repository, sources.length),
    sources: sources.map((source) => formatSource(source, repository)),
  });
});

export default router;