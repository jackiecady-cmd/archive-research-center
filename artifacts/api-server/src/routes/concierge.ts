import { Router } from "express";
import { db, collectionsTable, sourcesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { sendValidationError } from "../lib/http";
import { TRANSLATION_DISCLOSURE } from "@workspace/config";
import { visibleExcerpt } from "../lib/holding";
import { publicSourceType } from "../lib/source-type";
import { recommendBody } from "../validation/bodies";

const router = Router();

const PATHS = [
  {
    id: "beginner",
    name: "New to Historical Research",
    description: "Start with curated introductions. We will show you how sources are classified, what provenance means, and why evidence trails matter before you dive deep.",
    audience: "Beginners and curious learners",
    icon: "BookOpen",
    suggestedCollections: ["hekate", "yeshua"],
    suggestedStartingPoints: ["Start with a flagship collection", "Read how evidence confidence is graded", "Open your first Research Project"],
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
    suggestedStartingPoints: ["Filter sources by original language", "Open the Translation Center", "Note your translation decisions in a Project"],
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

router.get("/concierge/paths", async (_req, res): Promise<void> => {
  res.json(PATHS);
});

router.post("/concierge/recommend", async (req, res): Promise<void> => {
  const parsed = recommendBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const path = PATHS.find((item) => item.id === parsed.data.researcherType);
  if (!path) {
    res.status(400).json({
      error: "Validation failed",
      fieldErrors: { researcherType: ["Choose a research pathway"] },
    });
    return;
  }

  const collectionRows = path.suggestedCollections.length
    ? await db.select().from(collectionsTable).where(sql`${collectionsTable.slug} = ANY(ARRAY[${sql.join(path.suggestedCollections.map((slug: string) => sql`${slug}`), sql`, `)}]::text[])`)
    : await db.select().from(collectionsTable).where(eq(collectionsTable.featured, true));

  const slugs = collectionRows.map((collection) => collection.slug);
  const sourceRows = slugs.length
    ? await db.select().from(sourcesTable)
        .where(sql`${sourcesTable.collectionSlug} = ANY(ARRAY[${sql.join(slugs.map((slug: string) => sql`${slug}`), sql`, `)}]::text[])`)
        .limit(4)
    : await db.select().from(sourcesTable).limit(4);

  const collections = collectionRows.map((collection) => ({
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description ?? null,
    subject: collection.subject,
    iconLabel: collection.iconLabel ?? null,
    sourceCount: 0,
    featured: collection.featured,
    coverImageUrl: collection.coverImageUrl ?? null,
  }));

  const suggestedSources = sourceRows.map((source) => ({
    id: source.id,
    title: source.title,
    sourceType: publicSourceType(source.sourceType),
    collectionSlug: source.collectionSlug ?? null,
    collectionName: null,
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
    excerpt: visibleExcerpt(source),
    translationDisclosure: TRANSLATION_DISCLOSURE,
    externalUrl: source.externalUrl ?? null,
    tags: source.tags,
    createdAt: source.createdAt.toISOString(),
  }));

  res.json({
    path,
    suggestedSources,
    suggestedCollections: collections,
    nextSteps: path.suggestedStartingPoints,
  });
});

export default router;
