import { hidesSourceTextFromSearch, isCitationOnly, type HoldingRecord } from "@workspace/config/legal";

type PrefillSource = HoldingRecord & {
  originalLanguageText?: string | null;
  excerpt?: string | null;
};

/** Source text is not copied into a workspace for citation-only, CDLI, or CC BY-NC records. */
export function prefillOriginalText(source: PrefillSource, existing: string): string {
  if (isCitationOnly(source) || hidesSourceTextFromSearch(source)) return existing;
  if (existing.trim()) return existing;
  return source.originalLanguageText?.trim() || source.excerpt?.trim() || "";
}

export type WorkspaceCache = {
  layers?: { originalText?: string; commentary?: string; literalTranslation?: string; [key: string]: string | undefined };
  translationId?: number;
};

/** Clears only originalText when it is the pre-filled source text. Other layers stay. */
export function withoutPrefilledSourceText<T extends WorkspaceCache>(entry: T, hiddenTexts: string[]): T {
  const current = entry.layers?.originalText?.trim() ?? "";
  if (!current || !hiddenTexts.some((text) => text.trim() === current)) return entry;
  return {
    ...entry,
    layers: { ...entry.layers, originalText: "" },
  };
}
