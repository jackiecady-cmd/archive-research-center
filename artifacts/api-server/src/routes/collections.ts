import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, collectionsTable, repositoriesTable, sourcesTable } from "@workspace/db";

const router = Router();

function formatCollection(row: typeof collectionsTable.$inferSelect, sourceCount = 0) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    subject: row.subject,
    iconLabel: row.iconLabel ?? null,
    sourceCount,
    featured: row.featured,
    coverImageUrl: row.coverImageUrl ?? null,
  };
}

// GET /collections
router.get("/collections", async (req, res): Promise<void> => {
  const cols = await db.select().from(collectionsTable).orderBy(desc(collectionsTable.featured));
  const all = await db.select().from(sourcesTable);
  const counts: Record<string, number> = {};
  for (const s of all) {
    if (s.collectionSlug) counts[s.collectionSlug] = (counts[s.collectionSlug] ?? 0) + 1;
  }
  res.json(cols.map((c) => formatCollection(c, counts[c.slug] ?? 0)));
});

// GET /collections/:slug
router.get("/collections/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [col] = await db.select().from(collectionsTable).where(eq(collectionsTable.slug, slug));
  if (!col) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const sources = await db.select().from(sourcesTable).where(eq(sourcesTable.collectionSlug, slug));
  const repositories = await db.select().from(repositoriesTable);
  const repositoryMap = Object.fromEntries(
    repositories.map((repository) => [repository.id, repository]),
  );
  res.json({
    collection: formatCollection(col, sources.length),
    sources: sources.map((s) => ({
      id: s.id,
      title: s.title,
      sourceType: s.sourceType,
      collectionSlug: s.collectionSlug ?? null,
      collectionName: col.name,
      repository: s.repositoryId
        ? {
            id: repositoryMap[s.repositoryId]?.id,
            name: repositoryMap[s.repositoryId]?.name,
            slug: repositoryMap[s.repositoryId]?.slug,
            url: repositoryMap[s.repositoryId]?.url,
            institutionType: repositoryMap[s.repositoryId]?.institutionType,
          }
        : null,
      repositoryAccessStatus: s.repositoryAccessStatus ?? null,
      repositoryAccessNote: s.repositoryAccessNote ?? null,
      author: s.author ?? null,
      dateLabel: s.dateLabel ?? null,
      language: s.language ?? null,
      originalLanguage: s.originalLanguage ?? null,
      provenance: s.provenance,
      confidence: s.confidence,
      chronology: s.chronology ?? null,
      availability: s.availability,
      rightsStatement: s.rightsStatement ?? null,
      description: s.description ?? null,
      excerpt: s.excerpt ?? null,
      externalUrl: s.externalUrl ?? null,
      tags: s.tags,
      createdAt: s.createdAt.toISOString(),
    })),
  });
});

export default router;
