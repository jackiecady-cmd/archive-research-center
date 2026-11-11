import type { NextFunction, Request, Response } from "express";
import { apiPath, isAuthEndpoint, isPublicRead } from "../lib/security";
import { isModerator } from "./policy";
import { readServiceUser, readSessionUser, type SessionUser } from "./session";

function bearerToken(req: Request): string | null {
  const header = req.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? "";
}

export async function authenticateUnlessPublic(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const bearer = bearerToken(req);
    if (bearer !== null) {
      if (!bearer) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      const serviceUser = await readServiceUser(bearer);
      if (!serviceUser) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      req.user = serviceUser;
      next();
      return;
    }

    const path = apiPath(req);
    if (isAuthEndpoint(path) || isPublicRead(req.method, path)) {
      req.user = (await readSessionUser(req)) ?? undefined;
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

export function requireUser(req: Request, res: Response): SessionUser | null {
  const user = currentUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return user;
}

export function requireModerator(req: Request, res: Response): SessionUser | null {
  const user = requireUser(req, res);
  if (!user) return null;
  if (user.forumSuspended) {
    res.status(403).json({ error: "Your forum access is suspended" });
    return null;
  }
  if (!isModerator(user)) {
    res.status(403).json({ error: "Moderator role required" });
    return null;
  }
  return user;
}

export function requireAdmin(req: Request, res: Response): SessionUser | null {
  const user = requireUser(req, res);
  if (!user) return null;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Admin role required" });
    return null;
  }
  return user;
}
