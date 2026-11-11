/**
 * Legal-page and retention settings. Retention periods are never invented here.
 * An unset value means "do not auto-delete."
 */

export function legalPagesLive(env: Record<string, string | undefined> = process.env): boolean {
  const raw = (env.LEGAL_PAGES_LIVE ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true";
}

/** A square-bracket fill-in such as [EFFECTIVE DATE]. Markdown links are not fill-ins. */
export function hasBracketedPlaceholder(text: string): boolean {
  const pattern = /\[([^\]\n]+)\]/g;
  let match: RegExpExecArray | null = pattern.exec(text);
  while (match) {
    const body = match[1] ?? "";
    const next = text[match.index + match[0].length];
    if (next !== "(" && /[A-Z]/.test(body)) return true;
    match = pattern.exec(text);
  }
  return false;
}

export function legalPageIsPublic(text: string, env: Record<string, string | undefined> = process.env): boolean {
  return legalPagesLive(env) && !hasBracketedPlaceholder(text);
}

/** Drop attorney drafting notes before a page is shown to anyone who is not an administrator. */
export function stripNonPublicSections(markdown: string): string {
  const pattern = /^#{1,6} .*(?:Drafting notes|not part of the public).*$/im;
  const match = pattern.exec(markdown);
  if (!match) return markdown;
  return markdown.slice(0, match.index).trimEnd() + "\n";
}

export const RETENTION_SETTINGS = [
  {
    key: "compCodeIncidents",
    env: "RETENTION_COMP_CODE_INCIDENTS",
    label: "comp-code incident logs (IP address and user agent)",
  },
  {
    key: "closedAccounts",
    env: "RETENTION_CLOSED_ACCOUNTS",
    label: "closed accounts",
  },
  {
    key: "forumPosts",
    env: "RETENTION_FORUM_POSTS",
    label: "forum posts",
  },
  {
    key: "privateRoomMessages",
    env: "RETENTION_PRIVATE_ROOM_MESSAGES",
    label: "private-room messages",
  },
] as const;

export function readRetention(env: Record<string, string | undefined> = process.env) {
  return RETENTION_SETTINGS.map((item) => {
    const raw = env[item.env]?.trim() ?? "";
    return { ...item, value: raw.length > 0 ? raw : null };
  });
}

export function retentionWarnings(env: Record<string, string | undefined> = process.env): string[] {
  return readRetention(env)
    .filter((item) => item.value === null)
    .map((item) => `${item.env} is unset. ${item.label} will not be auto-deleted.`);
}

const CITATION_ONLY_STATUS = new Set([
  "restricted",
  "blocked",
  "catalog-only",
  "catalog_only",
  "reference-only",
  "reference_only",
  "link-only",
  "link_only",
]);

export type HoldingRecord = {
  availability?: string | null;
  repositoryAccessStatus?: string | null;
  rightsStatement?: string | null;
  description?: string | null;
  provenance?: string | null;
  externalUrl?: string | null;
  originalLanguageText?: string | null;
  excerpt?: string | null;
};

function statusToken(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Records that may be shown as a citation and a link, never exported as full text. */
export function isCitationOnly(record: HoldingRecord): boolean {
  if (CITATION_ONLY_STATUS.has(statusToken(record.availability))) return true;
  if (CITATION_ONLY_STATUS.has(statusToken(record.repositoryAccessStatus))) return true;
  const note = [record.rightsStatement, record.description, record.provenance].join("\n").toLowerCase();
  if (/link-only|reference-only|catalogue reference only|catalog reference only|catalog-only|catalogue-only/.test(note)) {
    return true;
  }
  if (/\bcdli\b|cuneiform digital library/.test(note)) return true;
  if (/cc\s*by-nc|by-nc-sa|non-?commercial/.test(note) && /\b(image|photograph|photo)\b/.test(note) && !/no (manuscript )?image|no photograph/.test(note)) {
    return true;
  }
  return false;
}

function holdingNote(record: HoldingRecord): string {
  return [record.rightsStatement, record.description, record.provenance, record.externalUrl].join("\n").toLowerCase();
}

/** CDLI text, and source text under CC BY-NC, stays off the public record until counsel rules. */
export function omitOffsiteSourceText(record: HoldingRecord): boolean {
  const note = holdingNote(record);
  return /\bcdli\b|cuneiform digital library|cc\s*by-nc|by-nc-sa/.test(note);
}

/** CDLI excerpts and noncommercial museum or BY-NC images are not served from this site. */
export function omitOffsiteExcerpt(record: HoldingRecord): boolean {
  return /\bcdli\b|cuneiform digital library/.test(holdingNote(record));
}

export function omitOffsiteImage(record: HoldingRecord): boolean {
  const note = holdingNote(record);
  return /\bcdli\b|cuneiform digital library|cc\s*by-nc|by-nc-sa|non-?commercial/.test(note);
}
