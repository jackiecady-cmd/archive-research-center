import { isCitationOnly, omitOffsiteExcerpt, omitOffsiteSourceText, type HoldingRecord } from "@workspace/config/legal";

type HoldingRow = HoldingRecord & {
  excerpt?: string | null;
  originalLanguageText?: string | null;
};

export function visibleExcerpt(row: HoldingRow): string | null {
  if (isCitationOnly(row) || omitOffsiteExcerpt(row)) return null;
  return row.excerpt ?? null;
}

export function visibleOriginalText(row: HoldingRow): string | null {
  if (isCitationOnly(row) || omitOffsiteSourceText(row)) return null;
  return row.originalLanguageText ?? null;
}
