import type { ErrorRequestHandler } from "express";
import { logger } from "./logger";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const parseFailed =
    err instanceof SyntaxError ||
    (typeof err === "object" && err !== null && (err as { type?: string }).type === "entity.parse.failed");
  if (parseFailed) {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const status =
    typeof err === "object" && err !== null && typeof (err as { status?: unknown }).status === "number"
      ? (err as { status: number }).status
      : 500;
  const expose =
    typeof err === "object" && err !== null && typeof (err as { expose?: unknown }).expose === "string"
      ? (err as { expose: string }).expose
      : null;
  if (status >= 400 && status < 500 && expose) {
    res.status(status).json({ error: expose });
    return;
  }

  req.log?.error({ err }, "request failed");
  logger.error({ err }, "request failed");
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error" });
};
