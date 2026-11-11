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
    id: "genealogist",
    name: "Genealogist / Family Historian",
    description: "Trace ancestry through documented migration corridors. Combine archive sources with external DNA analysis tools to contextualise genetic signals within their historical populations.",
    audience: "Genealogists, family historians, DNA researchers",
    icon: "GitBranch",
    suggestedCollections: [],
    suggestedStartingPoints: ["Open the Genealogy & DNA pathway", "Upload your raw DNA file to DNAGenics for free admixture analysis", "Search the archive for the migration corridor your DNA results point to", "Build a Research Project to link historical sources to your genetic signals"],
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

// DNA goal → DNAGenics tool recommendations (external third-party resource)
const DNA_GOAL_RESOURCES: Record<string, {
  label: string;
  description: string;
  tools: { name: string; description: string; url: string }[];
  archiveSuggestion: string;
}> = {
  broad_ancestry: {
    label: "Broad Ancestry Overview",
    description: "You want a general picture of your deep ancestry across continents and major population groups.",
    tools: [
      {
        name: "Start Free Analysis",
        description: "Upload your raw DNA file from AncestryDNA, 23andMe, MyHeritage, or FTDNA. DNAGenics will run it against their calculator library and return model-based admixture estimates.",
        url: "https://dnagenics.com",
      },
      {
        name: "Browse All Calculators",
        description: "Over 100 admixture calculators covering broad continental, sub-continental, and ancient-reference models. Each calculator uses different reference populations and models — results are estimates, not definitive ancestry.",
        url: "https://dnagenics.com",
      },
    ],
    archiveSuggestion: "Search the archive for scholarship on population genetics and ancient migration to understand what the calculator reference populations represent historically.",
  },
  regional_ancestry: {
    label: "Regional Ancestry (European, Middle Eastern, South Asian, etc.)",
    description: "You want fine-grained regional breakdowns within a broad geographic zone — e.g. distinguishing Scandinavian from Balkan within a European result.",
    tools: [
      {
        name: "Regional Admixture Calculators",
        description: "DNAGenics includes calculators tuned to specific regions — European sub-populations, Near Eastern components, South Asian clines, and more. Select calculators relevant to the region your paper trail points to.",
        url: "https://dnagenics.com",
      },
      {
        name: "Start Free Analysis",
        description: "Upload your raw DNA file to run multiple regional models in one session. Compare outputs across calculators — consistent signals across multiple models carry more weight than a single result.",
        url: "https://dnagenics.com",
      },
    ],
    archiveSuggestion: "Use the archive to find scholarship on the historical populations your regional results reference. Calculator labels like 'Anatolian Farmer' or 'Western Steppe Herder' correspond to specific archaeological cultures — the archive can help you understand what those populations actually were.",
  },
  ancient_ancestry: {
    label: "Ancient & Deep Ancestry",
    description: "You want to understand your deep prehistoric ancestry — Neolithic farmers, Steppe pastoralists, hunter-gatherer populations, and other ancient lineages.",
    tools: [
      {
        name: "Ancient DNA Calculators",
        description: "DNAGenics includes calculators built on ancient DNA reference panels, modelling your genome against archaeologically documented prehistoric populations. These are model-based estimates using statistical approximation — treat them as signals for further historical research, not definitive lineage certificates.",
        url: "https://dnagenics.com",
      },
      {
        name: "Browse Calculators",
        description: "Filter for ancient-reference models. Look for calculators citing aDNA (ancient DNA) reference populations derived from published archaeological studies.",
        url: "https://dnagenics.com",
      },
    ],
    archiveSuggestion: "The archive contains scholarship on ancient population movements — Yamnaya expansion, Bronze Age migrations, Neolithic transition in Europe and the Near East. Cross-reference your ancient DNA signals with these documented historical events.",
  },
  migration_patterns: {
    label: "Migration Patterns & Population Corridors",
    description: "You want to trace which historical migration routes are reflected in your DNA, and connect genetic signals to documented population movements.",
    tools: [
      {
        name: "Migration & Population Analysis",
        description: "DNAGenics's free analysis tools can identify components associated with documented migration corridors — Silk Road gene flow, Indo-European expansions, Semitic population movements, etc. These are model-based signals requiring historical corroboration.",
        url: "https://dnagenics.com",
      },
      {
        name: "Start Free Analysis",
        description: "Upload your raw DNA file and run multiple models. Recurring signals across different calculators — especially those using ancient reference populations — are the most useful starting points for archive research.",
        url: "https://dnagenics.com",
      },
    ],
    archiveSuggestion: "This is where the archive is most directly useful. Once you identify a migration signal, search for scholarship on that specific population movement. Build a Research Project linking your DNA signals to specific sources from the archive.",
  },
  kit_comparison: {
    label: "Kit Comparison & Family Matching",
    description: "You want to compare your DNA results against family members, or compare results across different testing providers.",
    tools: [
      {
        name: "Kit Comparison Tools",
        description: "DNAGenics allows you to upload and compare multiple kits — useful for verifying shared ancestry between known relatives or tracing which ancestral line a particular component comes from. Comparison outputs are model-based and depend on the reference populations used.",
        url: "https://dnagenics.com",
      },
      {
        name: "Browse Calculators",
        description: "Run the same calculator on multiple family kits to identify which components are shared (and therefore genealogically older) versus which are unique to one individual.",
        url: "https://dnagenics.com",
      },
    ],
    archiveSuggestion: "After identifying shared components, use the archive to research the historical populations those components represent. A shared ancient component across multiple family kits points to a documented population your ancestors were part of.",
  },
  file_conversion: {
    label: "Raw File Upload, Conversion & Imputation",
    description: "You already have raw DNA data from a testing provider and want to use it with additional analysis tools.",
    tools: [
      {
        name: "Raw DNA File Upload",
        description: "DNAGenics accepts raw DNA files from AncestryDNA, 23andMe, MyHeritage, FamilyTreeDNA, and other major providers. Upload once to access all 100+ calculators without re-testing.",
        url: "https://dnagenics.com",
      },
      {
        name: "File Conversion & Imputation",
        description: "DNAGenics offers file conversion and imputation tools to expand the utility of your existing raw data. Imputation statistically infers additional SNPs — results are estimates and quality varies by reference panel.",
        url: "https://dnagenics.com",
      },
    ],
    archiveSuggestion: "Your testing provider's raw file contains the same underlying genetic data regardless of which admixture reports they offer. Using it with DNAGenics's calculator library gives you access to research-grade models that most consumer testing providers do not offer.",
  },
};

// GET /concierge/paths
router.get("/concierge/paths", async (_req, res): Promise<void> => {
  res.json(PATHS);
});

// POST /concierge/recommend
router.post("/concierge/recommend", async (req, res): Promise<void> => {
  const { researcherType, interests = [], dnaGoal } = req.body;
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

  // For genealogist paths: include DNA tool recommendations keyed to their stated goal
  const dnaResources = (researcherType === "genealogist" && dnaGoal && DNA_GOAL_RESOURCES[dnaGoal])
    ? DNA_GOAL_RESOURCES[dnaGoal]
    : null;

  res.json({
    path,
    suggestedSources,
    suggestedCollections: collections,
    nextSteps: path.suggestedStartingPoints,
    dnaResources,
  });
});

export default router;
