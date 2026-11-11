const PUBLIC_SOURCE_TYPES = new Set([
  "primary",
  "translation",
  "scholarship",
  "interpretation",
  "conclusion",
]);

/** Older rows may still carry a retired classification. Member-facing responses use a public type. */
export function publicSourceType(value: string): string {
  return PUBLIC_SOURCE_TYPES.has(value) ? value : "interpretation";
}
