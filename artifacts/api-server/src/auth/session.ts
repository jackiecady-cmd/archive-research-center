import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db, sessionsTable, usersTable, USER_ROLES, type UserRole } from "@workspace/db";

export const SESSION_COOKIE = "arc_session";
const SESSION_MS = 14 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
};

export function sessionCookieOptions(env: string | undefined = process.env.NODE_ENV) {
  return {
    httpOnly: true,
    secure: env === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MS,
  };
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newSessionToken(): { token: string; id: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, id: hashSessionToken(token) };
}

function isRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export function toPublicUser(user: SessionUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}

export async function readSessionUser(req: Request): Promise<SessionUser | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string" || token.length < 20) return null;
  const id = hashSessionToken(token);
  const [row] = await db
    .select({
      sessionId: sessionsTable.id,
      expiresAt: sessionsTable.expiresAt,
      userId: usersTable.id,
      email: usersTable.email,
      displayName: usersTable.displayName,
      role: usersTable.role,
    })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(eq(sessionsTable.id, id));
  if (!row || !isRole(row.role)) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, id));
    return null;
  }
  return {
    id: row.userId,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
  };
}

export async function createSession(res: Response, userId: number): Promise<void> {
  const { token, id } = newSessionToken();
  await db.insert(sessionsTable).values({
    id,
    userId,
    expiresAt: new Date(Date.now() + SESSION_MS),
  });
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function destroySession(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token === "string" && token.length >= 20) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, hashSessionToken(token)));
  }
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
