import type { NextFunction, Request, Response } from "express";

const PUBLIC_GET = new Set([
  "/healthz",
  "/sources",
  "/sources/stats",
  "/collections",
  "/repositories",
  "/membership/plans",
  "/forum/threads",
  "/forum/recent",
  "/forum/categories",
]);

const AUTH_PATHS = new Set([
  "/auth/register",
  "/auth/login",
  "/auth/logout",
  "/auth/me",
]);

export function allowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS ?? "http://localhost:5173";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0 && origin !== "*");
}

export function apiPath(req: Request): string {
  const raw = (req.originalUrl || req.url || "").split("?")[0] ?? "";
  const stripped = raw.startsWith("/api") ? raw.slice(4) : raw;
  const path = stripped.length === 0 ? "/" : stripped;
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function isAuthEndpoint(path: string): boolean {
  return AUTH_PATHS.has(path);
}

export function isPublicRead(method: string, path: string): boolean {
  if (method !== "GET" && method !== "HEAD") return false;
  if (PUBLIC_GET.has(path)) return true;
  if (/^\/sources\/\d+$/.test(path)) return true;
  if (/^\/sources\/\d+\/export$/.test(path)) return true;
  if (path === "/legal/pages" || /^\/legal\/pages\/[a-z0-9-]+$/.test(path)) return true;
  if (/^\/collections\/[^/]+$/.test(path)) return true;
  if (/^\/repositories\/[^/]+$/.test(path)) return true;
  if (/^\/forum\/threads\/\d+$/.test(path)) return true;
  return false;
}

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function likeContains(value: string): string {
  return `%${escapeLike(value)}%`;
}

export function parseListPage(value: unknown): number | null {
  if (value === undefined || value === "") return 1;
  const page = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(page) || page < 1) return null;
  return page;
}

export function parseListLimit(value: unknown, fallback = 20): number | null {
  if (value === undefined || value === "") return fallback;
  const limit = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) return null;
  return limit;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }
  const allowed = new Set(allowedOrigins());
  const origin = req.get("origin");
  if (origin) {
    if (!allowed.has(origin)) {
      res.status(403).json({ error: "Cross-site request blocked" });
      return;
    }
    next();
    return;
  }
  const referer = req.get("referer");
  if (referer) {
    try {
      if (!allowed.has(new URL(referer).origin)) {
        res.status(403).json({ error: "Cross-site request blocked" });
        return;
      }
    } catch {
      res.status(403).json({ error: "Cross-site request blocked" });
      return;
    }
  }
  next();
}

type Bucket = { count: number; resetAt: number };

export function createRateLimiter(options: { windowMs: number; max: number }) {
  const buckets = new Map<string, Bucket>();
  return function rateLimit(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    let bucket = buckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(ip, bucket);
    }
    bucket.count += 1;
    if (buckets.size > 10_000) {
      for (const [key, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(key);
      }
    }
    if (bucket.count > options.max) {
      res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      res.status(429).json({ error: "Too many requests" });
      return;
    }
    next();
  };
}

/** In-handler budget keyed by account id or IP. True while the caller is still inside the cap. */
export function createBudget(options: { windowMs: number; max: number }) {
  const buckets = new Map<string, Bucket>();
  return function allow(key: string): boolean {
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (buckets.size > 10_000) {
      for (const [entry, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(entry);
      }
    }
    return bucket.count <= options.max;
  };
}
