import { Router } from "express";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { whereAll } from "../auth/ownership";
import {
  db,
  forumRoomInvitesTable,
  forumRoomMembersTable,
  forumRoomPostsTable,
  forumRoomsTable,
  usersTable,
} from "@workspace/db";
import { requireUser } from "../auth/middleware";
import { canJoinPrivateRoom, isModerator } from "../auth/policy";
import { hashOpaqueSecret, newOpaqueCode } from "../auth/secrets";
import type { SessionUser } from "../auth/session";
import { parseIntParam, sendValidationError } from "../lib/http";
import { redeemCodeBody, roomCreateBody, roomInviteBody, roomPostBody } from "../validation/bodies";

const router = Router();

function formatRoom(row: typeof forumRoomsTable.$inferSelect) {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    name: row.name,
    description: row.description,
    locked: row.lockedAt !== null,
    hidden: row.hiddenAt !== null,
    createdAt: row.createdAt.toISOString(),
  };
}

function formatPost(row: typeof forumRoomPostsTable.$inferSelect) {
  return {
    id: row.id,
    roomId: row.roomId,
    userId: row.userId,
    authorName: row.authorName,
    content: row.content,
    hidden: row.hiddenAt !== null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function membership(roomId: number, userId: number) {
  const [row] = await db
    .select()
    .from(forumRoomMembersTable)
    .where(and(eq(forumRoomMembersTable.roomId, roomId), eq(forumRoomMembersTable.userId, userId)));
  return row ?? null;
}

async function visibleRoom(roomId: number, user: SessionUser) {
  const [room] = await db.select().from(forumRoomsTable).where(eq(forumRoomsTable.id, roomId));
  if (!room) return { room: null, member: null, status: 404 as const };
  const member = await membership(roomId, user.id);
  if (room.hiddenAt && !isModerator(user)) return { room: null, member: null, status: 404 as const };
  if (!member && !isModerator(user)) return { room: null, member: null, status: 404 as const };
  return { room, member, status: 200 as const };
}

router.get("/rooms", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const rows = await db
    .select({ room: forumRoomsTable })
    .from(forumRoomMembersTable)
    .innerJoin(forumRoomsTable, eq(forumRoomMembersTable.roomId, forumRoomsTable.id))
    .where(and(eq(forumRoomMembersTable.userId, user.id), isNull(forumRoomsTable.hiddenAt)))
    .orderBy(desc(forumRoomsTable.createdAt));
  res.json(rows.map((row) => formatRoom(row.room)));
});

router.post("/rooms", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  if (user.forumSuspended) {
    res.status(403).json({ error: "Your forum access is suspended" });
    return;
  }
  if (!canJoinPrivateRoom(user)) {
    res.status(403).json({ error: "Private rooms are limited to paid and comp access" });
    return;
  }
  const parsed = roomCreateBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const created = await db.transaction(async (tx) => {
    const [room] = await tx.insert(forumRoomsTable).values({
      ownerUserId: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    }).returning();
    await tx.insert(forumRoomMembersTable).values({
      roomId: room.id,
      userId: user.id,
      memberRole: "owner",
    });
    return room;
  });
  res.status(201).json(formatRoom(created));
});

router.post("/rooms/join", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  if (user.forumSuspended) {
    res.status(403).json({ error: "Your forum access is suspended" });
    return;
  }
  const parsed = redeemCodeBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  if (!canJoinPrivateRoom(user)) {
    res.status(403).json({ error: "Private rooms are limited to paid and comp access" });
    return;
  }
  const codeHash = hashOpaqueSecret("room", parsed.data.code);
  const joined = await db.transaction(async (tx) => {
    const [invite] = await tx
      .select()
      .from(forumRoomInvitesTable)
      .where(eq(forumRoomInvitesTable.codeHash, codeHash))
      .for("update");
    if (!invite || invite.revokedAt) return { error: "invalid" as const };
    if (invite.expiresAt && invite.expiresAt.getTime() <= Date.now()) return { error: "invalid" as const };
    const [room] = await tx.select().from(forumRoomsTable).where(eq(forumRoomsTable.id, invite.roomId));
    if (!room || room.hiddenAt) return { error: "invalid" as const };
    const [existing] = await tx
      .select({ id: forumRoomMembersTable.id })
      .from(forumRoomMembersTable)
      .where(and(eq(forumRoomMembersTable.roomId, room.id), eq(forumRoomMembersTable.userId, user.id)));
    if (!existing) {
      await tx.insert(forumRoomMembersTable).values({
        roomId: room.id,
        userId: user.id,
        memberRole: "member",
      });
    }
    return { error: null, room };
  });
  if (joined.error) {
    res.status(400).json({ error: "That invitation is not valid" });
    return;
  }
  res.json(formatRoom(joined.room));
});

router.get("/rooms/:id", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const found = await visibleRoom(id, user);
  if (!found.room) {
    res.status(found.status).json({ error: "Not found" });
    return;
  }
  res.json(formatRoom(found.room));
});

router.get("/rooms/:id/posts", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const found = await visibleRoom(id, user);
  if (!found.room) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const posts = await db
    .select()
    .from(forumRoomPostsTable)
    .where(
      whereAll(
        eq(forumRoomPostsTable.roomId, id),
        isModerator(user) ? undefined : isNull(forumRoomPostsTable.hiddenAt),
      ),
    )
    .orderBy(asc(forumRoomPostsTable.createdAt));
  res.json(posts.map((post) => formatPost(post)));
});

router.post("/rooms/:id/posts", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  if (user.forumSuspended) {
    res.status(403).json({ error: "Your forum access is suspended" });
    return;
  }
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = roomPostBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const found = await visibleRoom(id, user);
  if (!found.room || !found.member) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (found.room.lockedAt) {
    res.status(403).json({ error: "This room is locked" });
    return;
  }
  const [row] = await db.insert(forumRoomPostsTable).values({
    roomId: id,
    userId: user.id,
    authorName: user.displayName,
    content: parsed.data.content,
  }).returning();
  res.status(201).json(formatPost(row));
});

router.post("/rooms/:id/invites", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = roomInviteBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const found = await visibleRoom(id, user);
  if (!found.room || found.member?.memberRole !== "owner") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (found.room.hiddenAt) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  let expiresAt: Date | null = null;
  if (parsed.data.expiresAt) {
    expiresAt = new Date(parsed.data.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      res.status(400).json({ error: "Validation failed", fieldErrors: { expiresAt: ["Choose a future expiry"] } });
      return;
    }
  }
  const minted = newOpaqueCode("room");
  const [row] = await db.insert(forumRoomInvitesTable).values({
    roomId: id,
    codeHash: minted.hash,
    codeHint: minted.hint,
    createdByUserId: user.id,
    expiresAt,
  }).returning();
  res.status(201).json({
    id: row.id,
    code: minted.secret,
    hint: row.codeHint,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  });
});

router.delete("/rooms/:id/invites/:inviteId", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  const inviteId = parseIntParam(req.params.inviteId);
  if (id === null || inviteId === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const found = await visibleRoom(id, user);
  if (!found.room || found.member?.memberRole !== "owner") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [row] = await db
    .update(forumRoomInvitesTable)
    .set({ revokedAt: new Date() })
    .where(and(
      eq(forumRoomInvitesTable.id, inviteId),
      eq(forumRoomInvitesTable.roomId, id),
      isNull(forumRoomInvitesTable.revokedAt),
    ))
    .returning({ id: forumRoomInvitesTable.id });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

router.get("/rooms/:id/members", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const found = await visibleRoom(id, user);
  if (!found.room) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const rows = await db
    .select({
      userId: usersTable.id,
      displayName: usersTable.displayName,
      memberRole: forumRoomMembersTable.memberRole,
      joinedAt: forumRoomMembersTable.joinedAt,
    })
    .from(forumRoomMembersTable)
    .innerJoin(usersTable, eq(forumRoomMembersTable.userId, usersTable.id))
    .where(eq(forumRoomMembersTable.roomId, id))
    .orderBy(asc(forumRoomMembersTable.joinedAt));
  res.json(rows.map((row) => ({
    userId: row.userId,
    displayName: row.displayName,
    memberRole: row.memberRole,
    joinedAt: row.joinedAt.toISOString(),
  })));
});

router.delete("/rooms/:id/members/:userId", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  const memberId = parseIntParam(req.params.userId);
  if (id === null || memberId === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const found = await visibleRoom(id, user);
  if (!found.room) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (found.member?.memberRole !== "owner") {
    res.status(found.member ? 403 : 404).json({ error: found.member ? "The room owner manages members" : "Not found" });
    return;
  }
  if (memberId === user.id) {
    res.status(400).json({ error: "The room owner cannot remove themselves" });
    return;
  }
  const [row] = await db
    .delete(forumRoomMembersTable)
    .where(and(eq(forumRoomMembersTable.roomId, id), eq(forumRoomMembersTable.userId, memberId)))
    .returning({ id: forumRoomMembersTable.id });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
