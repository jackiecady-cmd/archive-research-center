import { and, eq, isNotNull } from "drizzle-orm";
import { db, maintenanceMarkersTable, sourcesTable, translationsTable } from "@workspace/db";
import { hidesSourceTextFromSearch, isPrefilledSourceText } from "@workspace/config/legal";

export const CITATION_PREFILL_MARKER = "clear_citation_prefill_v1";

/**
 * One-time deploy task. Clears originalText on workspaces only when that field is
 * exactly the hidden excerpt, original-language text, or description of a
 * citation-only, CDLI, or CC BY-NC source. Other layers are left as the researcher wrote them.
 */
export async function clearPrefilledCitationSourceText(): Promise<number> {
  const [marker] = await db
    .select({ name: maintenanceMarkersTable.name })
    .from(maintenanceMarkersTable)
    .where(eq(maintenanceMarkersTable.name, CITATION_PREFILL_MARKER));
  if (marker) return 0;

  const rows = await db
    .select({
      id: translationsTable.id,
      originalText: translationsTable.originalText,
      excerpt: sourcesTable.excerpt,
      originalLanguageText: sourcesTable.originalLanguageText,
      description: sourcesTable.description,
      availability: sourcesTable.availability,
      repositoryAccessStatus: sourcesTable.repositoryAccessStatus,
      rightsStatement: sourcesTable.rightsStatement,
      provenance: sourcesTable.provenance,
      externalUrl: sourcesTable.externalUrl,
    })
    .from(translationsTable)
    .innerJoin(sourcesTable, eq(sourcesTable.id, translationsTable.sourceId))
    .where(isNotNull(translationsTable.originalText));

  let cleared = 0;
  for (const row of rows) {
    if (!hidesSourceTextFromSearch(row) || !isPrefilledSourceText(row, row.originalText ?? "")) continue;
    await db
      .update(translationsTable)
      .set({ originalText: null, updatedAt: new Date() })
      .where(and(eq(translationsTable.id, row.id), eq(translationsTable.originalText, row.originalText!)));
    cleared += 1;
  }

  await db.insert(maintenanceMarkersTable).values({ name: CITATION_PREFILL_MARKER }).onConflictDoNothing();
  return cleared;
}
