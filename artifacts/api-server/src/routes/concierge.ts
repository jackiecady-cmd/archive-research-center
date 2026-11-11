import { Router } from "express";
import { db, collectionsTable, sourcesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

const PATHS = [
  {
    id: "beginner",
    name: "New to Historical Research",
    description: "Start with curated introductions. We will show you how sources are classified, what provenance means, and why evidence trails matter before you dive deep.",
    audience: "Beginners and curious learners",
    icon: "BookOpen",
    suggestedCollections: ["hekate", "yeshua"],
    suggestedStartingPoints: ["Start with a flagship collection", "Read the evidence standards guide", "Open your first Research Project"],
  },
  {
    id: "pastor",
    name: "Pastor / Ministry Leader",
    description: "Navigate the historical Jesus materials with clear separation between primary sources, translations, scholarship, and interpretation. Build well-sourced sermon research.",
    audience: "Pastors, preachers, ministry leaders",
    icon: "Church",
    suggestedCollections: ["yeshua"],
    suggestedStartingPoints: ["Browse the Yeshua / Jesus of Nazareth collection", "Compare primary source types", "Create a Research Project for your series"],
  },
  {
    id: "translator",
    name: "Translator / Linguist",
    description: "Access primary sources with original language designations, translation lineage, and chronology data. Use the Translation Center for annotation work.",
    audience: "Translators, linguists, philologists",
    icon: "Languages",
    suggestedCollections: ["hekate", "yeshua"],
    suggestedStartingPoints: ["Filter sources by original language", "Open the Translation Center shell", "Note your translation decisions in a Project"],
  },
  {
    id: "archaeologist",
    name: "Archaeologist / Anthropologist",
    description: "Find primary sources with provenance, site context, and chronology. Build evidence trails around material culture claims. Track confidence levels across your field.",
    audience: "Archaeologists, anthropologists, field researchers",
    icon: "Shovel",
    suggestedCollections: ["hekate", "yeshua"],
    suggestedStartingPoints: ["Search by date range and provenance", "Create Claim Cards for your field hypotheses", "Use the Research Commons to connect with peers"],
  },
  {
    id: "occult",
    name: "Occult / Esoteric Researcher",
    description: "Study primary sources, grimoires, and historical magical practices under the same evidence standards as any other field. Hekate and related traditions are flagship collections here.",
    audience: "Occult researchers, esotericists, pagan practitioners",
    icon: "Moon",
    suggestedCollections: ["hekate"],
    suggestedStartingPoints: ["Open the Hekate collection", "Filter by source type: primary vs interpretation", "Evaluate confidence levels critically"],
  },
  {
    id: "historian",
    name: "Historian / Academic",
    description: "Full archive access with provenance, rights, and availability metadata. Build Claim Cards, construct evidence trails, and participate in the Research Commons.",
    audience: "Historians, academics, independent scholars",
    icon: "GraduationCap",
    suggestedCollections: ["hekate", "yeshua"],
    suggestedStartingPoints: ["Run an archive search with filters", "Examine source confidence ratings", "Post a thread in Research Commons"],
  },
];

// GET /concierge/paths
router.get("/concierge/paths", async (_req, res): Promise<void> => {
  res.json(PATHS);
});

// POST /concierge/recommend
router.post("/concierge/recommend", async (req, res): Promise<void> => {
  const { researcherType, interests = [] } = req.body;
  const path = PATHS.find((p) => p.id === researcherType) ?? PATHS[0];

  // Fetch suggested collections
  const collectionRows = path.suggestedCollections.length
    ? await db.select().from(collectionsTable).where(sql`${collectionsTable.slug} = ANY(ARRAY[${sql.join(path.suggestedCollections.map((s: string) => sql`${s}`), sql`, `)}]::text[])`)
    : await db.select().from(collectionsTable).where(eq(collectionsTable.featured, true));

  // Fetch a few sample sources from those collections
  const slugs = collectionRows.map((c) => c.slug);
  const sourceRows = slugs.length
    ? await db.select().from(sourcesTable)
        .where(sql`${sourcesTable.collectionSlug} = ANY(ARRAY[${sql.join(slugs.map((s: string) => sql`${s}`), sql`, `)}]::text[])`)
        .limit(4)
    : await db.select().from(sourcesTable).limit(4);

  const collections = collectionRows.map((c) => ({
    id: c.id, name: c.name, slug: c.slug, description: c.description ?? null,
    subject: c.subject, iconLabel: c.iconLabel ?? null, sourceCount: 0,
    featured: c.featured, coverImageUrl: c.coverImageUrl ?? null,
  }));

  const suggestedSources = sourceRows.map((s) => ({
    id: s.id, title: s.title, sourceType: s.sourceType,
    collectionSlug: s.collectionSlug ?? null, collectionName: null,
    author: s.author ?? null, dateLabel: s.dateLabel ?? null,
    language: s.language ?? null, originalLanguage: s.originalLanguage ?? null,
    provenance: s.provenance, confidence: s.confidence,
    chronology: s.chronology ?? null, availability: s.availability,
    rightsStatement: s.rightsStatement ?? null, description: s.description ?? null,
    excerpt: s.excerpt ?? null, externalUrl: s.externalUrl ?? null,
    tags: s.tags, createdAt: s.createdAt.toISOString(),
  }));

  res.json({
    path,
    suggestedSources,
    suggestedCollections: collections,
    nextSteps: path.suggestedStartingPoints,
  });
});

export default router;
