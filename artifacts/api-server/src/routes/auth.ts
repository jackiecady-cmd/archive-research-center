import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, hashPassword, verifyPassword, type UserRole } from "@workspace/db";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { sendValidationError } from "../lib/http";
import {
  createSession,
  destroySession,
  loadSessionUserById,
  toPublicUser,
} from "../auth/session";

const router = Router();

let dummyPasswordHash: Promise<string> | null = null;

function dummyHash(): Promise<string> {
  dummyPasswordHash ??= hashPassword("not-a-real-account");
  return dummyPasswordHash;
}

function roleForNewAccount(email: string): UserRole {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return adminEmail && email === adminEmail ? "admin" : "user";
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();
  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists" });
    return;
  }
  const passwordHash = await hashPassword(parsed.data.password);
  const [created] = await db
    .insert(usersTable)
    .values({
      email,
      passwordHash,
      displayName: parsed.data.displayName.trim(),
      role: roleForNewAccount(email),
    })
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      displayName: usersTable.displayName,
      role: usersTable.role,
    });
  const user = await loadSessionUserById(created.id);
  if (!user) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
  await createSession(res, user.id);
  res.status(201).json(toPublicUser(user));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();
  const [row] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  const passwordOk = row
    ? await verifyPassword(row.passwordHash, parsed.data.password)
    : await verifyPassword(await dummyHash(), parsed.data.password).then(() => false);
  if (!row || !passwordOk || row.accountKind === "service") {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && row.email === adminEmail && row.role !== "admin") {
    await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, row.id));
  }
  const user = await loadSessionUserById(row.id);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  await createSession(res, user.id);
  res.json(toPublicUser(user));
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  await destroySession(req, res);
  res.status(204).send();
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.json(toPublicUser(req.user));
});

export default router;
