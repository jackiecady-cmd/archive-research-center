import { Router } from "express";
import { randomBytes } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import {
  db,
  forumRepliesTable,
  forumRoomPostsTable,
  forumRoomsTable,
  forumThreadsTable,
  hashPassword,
  moderationEventsTable,
  serviceTokensTable,
  usersTable,
} from "@workspace/db";
import { writeAudit } from "../auth/audit";
import { requireAdmin, requireModerator } from "../auth/middleware";
import { newOpaqueCode } from "../auth/secrets";
import type { SessionUser } from "../auth/session";
import { parseIntParam, sendValidationError } from "../lib/http";
import { reasonBody, serviceAccountBody } from "../validation/bodies";

const router = Router();

async function readReason(req: { body?: unknown }, res: Parameters<typeof requireModerator>[1]): Promise<string | null | undefined> {
  const parsed = reasonBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return undefined;
  }
  return parsed.data.reason ?? null;
}

router.get("/moderation/audit", async (req, res): Promise<void> => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const rows = await db
    .select({
      id: moderationEventsTable.id,
      actorUserId: moderationEventsTable.actorUserId,
      actorName: usersTable.displayName,
      action: moderationEventsTable.action,
      targetType: moderationEventsTable.targetType,
      targetId: moderationEventsTable.targetId,
      reason: moderationEventsTable.reason,
      createdAt: moderationEventsTable.createdAt,
    })
    .from(moderationEventsTable)
    .innerJoin(usersTable, eq(moderationEventsTable.actorUserId, usersTable.id))
    .orderBy(desc(moderationEventsTable.createdAt))
    .limit(200);
  res.json(rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  })));
});

router.get("/moderation/rooms", async (req, res): Promise<void> => {
  const actor = requireModerator(req, res);
  if (!actor) return;
  const rows = await db.select().from(forumRoomsTable).orderBy(desc(forumRoomsTable.createdAt));
  res.json(rows.map((row) => ({
    id: row.id,
    ownerUserId: row.ownerUserId,
    name: row.name,
    description: row.description,
    locked: row.lockedAt !== null,
    hidden: row.hiddenAt !== null,
    createdAt: row.createdAt.toISOString(),
  })));
});

router.post("/moderation/service-accounts", async (req, res): Promise<void> => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const parsed = serviceAccountBody.safeParse(req.body);
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
  const minted = newOpaqueCode("service");
  const passwordHash = await hashPassword(randomBytes(32).toString("base64url"));
  const created = await db.transaction(async (tx) => {
    const [account] = await tx.insert(usersTable).values({
      email,
      passwordHash,
      displayName: parsed.data.displayName.trim(),
      role: "moderator",
      accountKind: "service",
      billingEntitlement: "free",
    }).returning();
    await tx.insert(serviceTokensTable).values({
      userId: account.id,
      tokenHash: minted.hash,
      createdByUserId: admin.id,
    });
    return account;
  });
  await writeAudit(admin.id, "service_account.create", "user", created.id, email);
  res.status(201).json({
    user: {
      id: created.id,
      email: created.email,
      displayName: created.displayName,
      role: "moderator",
      accountKind: "service",
    },
    token: minted.secret,
  });
});

async function moderateThread(
  req: Parameters<typeof requireModerator>[0],
  res: Parameters<typeof requireModerator>[1],
  action: "hide" | "unhide" | "lock" | "unlock",
): Promise<void> {
  const actor = requireModerator(req, res);
  if (!actor) return;
  const reason = await readReason(req, res);
  if (reason === undefined) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const patch = action === "hide"
    ? { hiddenAt: new Date(), hiddenByUserId: actor.id }
    : action === "unhide"
      ? { hiddenAt: null, hiddenByUserId: null }
      : action === "lock"
        ? { lockedAt: new Date() }
        : { lockedAt: null };
  const [row] = await db.update(forumThreadsTable).set(patch).where(eq(forumThreadsTable.id, id)).returning({ id: forumThreadsTable.id });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await writeAudit(actor.id, `thread.${action}`, "thread", id, reason);
  res.json({ id, action });
}

router.post("/moderation/threads/:id/hide", (req, res) => moderateThread(req, res, "hide"));
router.post("/moderation/threads/:id/unhide", (req, res) => moderateThread(req, res, "unhide"));
router.post("/moderation/threads/:id/lock", (req, res) => moderateThread(req, res, "lock"));
router.post("/moderation/threads/:id/unlock", (req, res) => moderateThread(req, res, "unlock"));

router.post("/moderation/replies/:id/hide", async (req, res): Promise<void> => {
  const actor = requireModerator(req, res);
  if (!actor) return;
  const reason = await readReason(req, res);
  if (reason === undefined) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .update(forumRepliesTable)
    .set({ hiddenAt: new Date(), hiddenByUserId: actor.id })
    .where(eq(forumRepliesTable.id, id))
    .returning({ id: forumRepliesTable.id });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await writeAudit(actor.id, "reply.hide", "reply", id, reason);
  res.json({ id, action: "hide" });
});

router.post("/moderation/replies/:id/unhide", async (req, res): Promise<void> => {
  const actor = requireModerator(req, res);
  if (!actor) return;
  const reason = await readReason(req, res);
  if (reason === undefined) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .update(forumRepliesTable)
    .set({ hiddenAt: null, hiddenByUserId: null })
    .where(eq(forumRepliesTable.id, id))
    .returning({ id: forumRepliesTable.id });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await writeAudit(actor.id, "reply.unhide", "reply", id, reason);
  res.json({ id, action: "unhide" });
});

function canSuspend(actor: SessionUser, targetRole: string, targetId: number): string | null {
  if (targetId === actor.id) return "You cannot suspend your own account";
  if (targetRole === "admin") return "Administrators cannot be suspended here";
  if (targetRole === "moderator" && actor.role !== "admin") return "Only an administrator can suspend a moderator";
  return null;
}

router.post("/moderation/users/:id/suspend", async (req, res): Promise<void> => {
  const actor = requireModerator(req, res);
  if (!actor) return;
  const reason = await readReason(req, res);
  if (reason === undefined) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const blocked = canSuspend(actor, target.role, target.id);
  if (blocked) {
    res.status(403).json({ error: blocked });
    return;
  }
  await db.update(usersTable).set({ forumSuspendedAt: new Date() }).where(eq(usersTable.id, id));
  await writeAudit(actor.id, "user.suspend", "user", id, reason);
  res.json({ id, suspended: true });
});

router.post("/moderation/users/:id/restore", async (req, res): Promise<void> => {
  const actor = requireModerator(req, res);
  if (!actor) return;
  const reason = await readReason(req, res);
  if (reason === undefined) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const blocked = canSuspend(actor, target.role, target.id);
  if (blocked) {
    res.status(403).json({ error: blocked });
    return;
  }
  await db.update(usersTable).set({ forumSuspendedAt: null }).where(eq(usersTable.id, id));
  await writeAudit(actor.id, "user.restore", "user", id, reason);
  res.json({ id, suspended: false });
});

router.post("/moderation/rooms/:id/hide", async (req, res): Promise<void> => {
  const actor = requireModerator(req, res);
  if (!actor) return;
  const reason = await readReason(req, res);
  if (reason === undefined) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .update(forumRoomsTable)
    .set({ hiddenAt: new Date() })
    .where(eq(forumRoomsTable.id, id))
    .returning({ id: forumRoomsTable.id });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await writeAudit(actor.id, "room.hide", "room", id, reason);
  res.json({ id, action: "hide" });
});

router.post("/moderation/rooms/:id/lock", async (req, res): Promise<void> => {
  const actor = requireModerator(req, res);
  if (!actor) return;
  const reason = await readReason(req, res);
  if (reason === undefined) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .update(forumRoomsTable)
    .set({ lockedAt: new Date() })
    .where(eq(forumRoomsTable.id, id))
    .returning({ id: forumRoomsTable.id });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await writeAudit(actor.id, "room.lock", "room", id, reason);
  res.json({ id, action: "lock" });
});

router.post("/moderation/rooms/:id/unlock", async (req, res): Promise<void> => {
  const actor = requireModerator(req, res);
  if (!actor) return;
  const reason = await readReason(req, res);
  if (reason === undefined) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .update(forumRoomsTable)
    .set({ lockedAt: null })
    .where(eq(forumRoomsTable.id, id))
    .returning({ id: forumRoomsTable.id });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await writeAudit(actor.id, "room.unlock", "room", id, reason);
  res.json({ id, action: "unlock" });
});

router.post("/moderation/room-posts/:id/hide", async (req, res): Promise<void> => {
  const actor = requireModerator(req, res);
  if (!actor) return;
  const reason = await readReason(req, res);
  if (reason === undefined) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .update(forumRoomPostsTable)
    .set({ hiddenAt: new Date(), hiddenByUserId: actor.id })
    .where(eq(forumRoomPostsTable.id, id))
    .returning({ id: forumRoomPostsTable.id });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await writeAudit(actor.id, "room_post.hide", "room_post", id, reason);
  res.json({ id, action: "hide" });
});

export default router;
