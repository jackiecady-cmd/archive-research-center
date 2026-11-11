import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { Request, Response } from "express";
import {
  db,
  sessionsTable,
  usersTable,
  compGrantsTable,
  serviceTokensTable,
  USER_ROLES,
  type UserRole,
  type EffectiveEntitlement,
} from "@workspace/db";
import { effectiveEntitlement } from "./policy";
import { hashOpaqueSecret } from "./secrets";

export const SESSION_COOKIE = "arc_session";
const SESSION_MS = 14 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
  entitlement: EffectiveEntitlement;
  accountKind: "human" | "service";
  forumSuspended: boolean;
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

function isAccountKind(value: string): value is SessionUser["accountKind"] {
  return value === "human" || value === "service";
}

export function toPublicUser(user: SessionUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    entitlement: user.entitlement,
  };
}

type UserRow = {
  userId: number;
  email: string;
  displayName: string;
  role: string;
  accountKind: string;
  billingEntitlement: string;
  forumSuspendedAt: Date | null;
  grantId: number | null;
};

function toSessionUser(row: UserRow): SessionUser | null {
  if (!isRole(row.role) || !isAccountKind(row.accountKind)) return null;
  return {
    id: row.userId,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    entitlement: effectiveEntitlement(row.billingEntitlement, row.grantId !== null),
    accountKind: row.accountKind,
    forumSuspended: row.forumSuspendedAt !== null,
  };
}

const userColumns = {
  userId: usersTable.id,
  email: usersTable.email,
  displayName: usersTable.displayName,
  role: usersTable.role,
  accountKind: usersTable.accountKind,
  billingEntitlement: usersTable.billingEntitlement,
  forumSuspendedAt: usersTable.forumSuspendedAt,
  grantId: compGrantsTable.id,
};

function userQuery() {
  return db
    .select(userColumns)
    .from(usersTable)
    .leftJoin(
      compGrantsTable,
      and(eq(compGrantsTable.userId, usersTable.id), isNull(compGrantsTable.revokedAt)),
    );
}

export async function loadSessionUserById(userId: number): Promise<SessionUser | null> {
  const [row] = await userQuery().where(eq(usersTable.id, userId));
  return row ? toSessionUser(row) : null;
}

export async function readSessionUser(req: Request): Promise<SessionUser | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string" || token.length < 20) return null;
  const id = hashSessionToken(token);
  const [row] = await db
    .select({
      sessionId: sessionsTable.id,
      expiresAt: sessionsTable.expiresAt,
      ...userColumns,
    })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .leftJoin(
      compGrantsTable,
      and(eq(compGrantsTable.userId, usersTable.id), isNull(compGrantsTable.revokedAt)),
    )
    .where(eq(sessionsTable.id, id));
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, id));
    return null;
  }
  return toSessionUser(row);
}

export async function readServiceUser(token: string): Promise<SessionUser | null> {
  if (token.length < 20) return null;
  const tokenHash = hashOpaqueSecret("service", token);
  const [row] = await db
    .select(userColumns)
    .from(serviceTokensTable)
    .innerJoin(usersTable, eq(serviceTokensTable.userId, usersTable.id))
    .leftJoin(
      compGrantsTable,
      and(eq(compGrantsTable.userId, usersTable.id), isNull(compGrantsTable.revokedAt)),
    )
    .where(and(eq(serviceTokensTable.tokenHash, tokenHash), isNull(serviceTokensTable.revokedAt)));
  if (!row) return null;
  const user = toSessionUser(row);
  if (!user || user.accountKind !== "service") return null;
  if (user.role !== "moderator" && user.role !== "admin") return null;
  return user;
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
