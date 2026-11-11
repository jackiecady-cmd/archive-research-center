import type { Response } from "express";

type Flattened = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

export function sendValidationError(
  res: Response,
  error: { flatten: () => Flattened },
): void {
  const flattened = error.flatten();
  res.status(400).json({
    error: "Validation failed",
    formErrors: flattened.formErrors,
    fieldErrors: flattened.fieldErrors,
  });
}

export function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parseIntParam(value: string | string[] | undefined): number | null {
  const raw = routeParam(value);
  if (!/^\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
