import type { NextFunction, Request, Response } from "express";
import { apiPath, isAuthEndpoint, isPublicRead } from "../lib/security";
import { readSessionUser, type SessionUser } from "./session";

export async function authenticateUnlessPublic(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const path = apiPath(req);
    if (isAuthEndpoint(path) || isPublicRead(req.method, path)) {
      if (path === "/auth/me" || path === "/auth/logout") {
        req.user = (await readSessionUser(req)) ?? undefined;
      }
      next();
      return;
    }
    const user = await readSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireEditor(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (req.user.role !== "editor" && req.user.role !== "admin") {
    res.status(403).json({ error: "Editor role required" });
    return;
  }
  next();
}

export function currentUser(req: Request): SessionUser | null {
  return req.user ?? null;
}
