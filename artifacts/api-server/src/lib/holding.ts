import { omitOffsiteExcerpt, omitOffsiteSourceText, type HoldingRecord } from "@workspace/config/legal";

type HoldingRow = HoldingRecord & {
  excerpt?: string | null;
  originalLanguageText?: string | null;
};

export function visibleExcerpt(row: HoldingRow): string | null {
  return omitOffsiteExcerpt(row) ? null : row.excerpt ?? null;
}

export function visibleOriginalText(row: HoldingRow): string | null {
  return omitOffsiteSourceText(row) ? null : row.originalLanguageText ?? null;
}
