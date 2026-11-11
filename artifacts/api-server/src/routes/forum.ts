import { Router } from "express";
import { desc, eq, isNull, sql } from "drizzle-orm";
import {
  PUBLIC_FORUM_CATEGORIES,
  db,
  forumRepliesTable,
  forumThreadsTable,
} from "@workspace/db";
import { CreateForumReplyBody, CreateForumThreadBody } from "@workspace/api-zod";
import { ownedBy, whereAll } from "../auth/ownership";
import { isModerator } from "../auth/policy";
import { requireUser } from "../auth/middleware";
import { parseIntParam, sendValidationError } from "../lib/http";
import { forumReplyUpdateBody, forumThreadUpdateBody, isPublicCategory } from "../validation/bodies";
import type { SessionUser } from "../auth/session";

const router = Router();

function formatThread(row: typeof forumThreadsTable.$inferSelect, replyCount = 0) {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    content: row.content,
    category: row.category,
    authorName: row.authorName,
    replyCount,
    tags: row.tags,
    locked: row.lockedAt !== null,
    hidden: row.hiddenAt !== null,
    createdAt: row.createdAt.toISOString(),
    lastActivityAt: row.lastActivityAt.toISOString(),
  };
}

function formatReply(row: typeof forumRepliesTable.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    threadId: row.threadId,
    content: row.content,
    authorName: row.authorName,
    hidden: row.hiddenAt !== null,
    createdAt: row.createdAt.toISOString(),
  };
}

function viewer(req: Parameters<typeof requireUser>[0]): SessionUser | null {
  return req.user ?? null;
}

function hiddenThreadFilter(user: SessionUser | null) {
  return user && isModerator(user) ? undefined : isNull(forumThreadsTable.hiddenAt);
}

function canPost(user: SessionUser, res: Parameters<typeof requireUser>[1]): boolean {
  if (user.forumSuspended) {
    res.status(403).json({ error: "Your forum access is suspended" });
    return false;
  }
  return true;
}

router.get("/forum/categories", async (_req, res): Promise<void> => {
  res.json([...PUBLIC_FORUM_CATEGORIES]);
});

router.get("/forum/recent", async (req, res): Promise<void> => {
  const user = viewer(req);
  const showHidden = Boolean(user && isModerator(user));
  const threads = await db
    .select()
    .from(forumThreadsTable)
    .where(showHidden ? undefined : isNull(forumThreadsTable.hiddenAt))
    .orderBy(desc(forumThreadsTable.lastActivityAt))
    .limit(5);
  const replies = await db
    .select({ reply: forumRepliesTable })
    .from(forumRepliesTable)
    .innerJoin(forumThreadsTable, eq(forumRepliesTable.threadId, forumThreadsTable.id))
    .where(
      showHidden
        ? undefined
        : whereAll(isNull(forumRepliesTable.hiddenAt), isNull(forumThreadsTable.hiddenAt)),
    )
    .orderBy(desc(forumRepliesTable.createdAt))
    .limit(5);
  res.json({
    recentThreads: threads.map((thread) => formatThread(thread)),
    recentReplies: replies.map(({ reply }) => formatReply(reply)),
  });
});

router.get("/forum/threads", async (req, res): Promise<void> => {
  const user = viewer(req);
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const rows = await db
    .select()
    .from(forumThreadsTable)
    .where(whereAll(hiddenThreadFilter(user), category ? eq(forumThreadsTable.category, category) : undefined))
    .orderBy(desc(forumThreadsTable.lastActivityAt));

  const threadIds = rows.map((row) => row.id);
  const replyCounts: Record<number, number> = {};
  if (threadIds.length) {
    const counts = await db
      .select({ threadId: forumRepliesTable.threadId, count: sql<number>`count(*)::int` })
      .from(forumRepliesTable)
      .where(
        whereAll(
          sql`${forumRepliesTable.threadId} = ANY(ARRAY[${sql.join(threadIds.map((id) => sql`${id}`), sql`, `)}]::int[])`,
          user && isModerator(user) ? undefined : isNull(forumRepliesTable.hiddenAt),
        ),
      )
      .groupBy(forumRepliesTable.threadId);
    for (const count of counts) replyCounts[count.threadId] = count.count;
  }

  res.json(rows.map((thread) => formatThread(thread, replyCounts[thread.id] ?? 0)));
});

router.post("/forum/threads", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user || !canPost(user, res)) return;
  const parsed = CreateForumThreadBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  if (!isPublicCategory(parsed.data.category)) {
    res.status(400).json({
      error: "Validation failed",
      fieldErrors: { category: ["Choose a public discussion category"] },
    });
    return;
  }
  const [row] = await db.insert(forumThreadsTable).values({
    title: parsed.data.title,
    content: parsed.data.content,
    category: parsed.data.category,
    tags: parsed.data.tags ?? [],
    authorName: user.displayName,
    userId: user.id,
  }).returning();
  res.status(201).json(formatThread(row));
});

router.get("/forum/threads/:id", async (req, res): Promise<void> => {
  const user = viewer(req);
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [thread] = await db
    .select()
    .from(forumThreadsTable)
    .where(whereAll(eq(forumThreadsTable.id, id), hiddenThreadFilter(user)));
  if (!thread) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const replies = await db
    .select()
    .from(forumRepliesTable)
    .where(
      whereAll(
        eq(forumRepliesTable.threadId, id),
        user && isModerator(user) ? undefined : isNull(forumRepliesTable.hiddenAt),
      ),
    )
    .orderBy(forumRepliesTable.createdAt);
  res.json({
    thread: formatThread(thread, replies.length),
    replies: replies.map((reply) => formatReply(reply)),
  });
});

router.patch("/forum/threads/:id", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = forumThreadUpdateBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const [row] = await db
    .update(forumThreadsTable)
    .set({
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.content !== undefined ? { content: parsed.data.content } : {}),
    })
    .where(whereAll(eq(forumThreadsTable.id, id), ownedBy(user, forumThreadsTable.userId)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatThread(row));
});

router.delete("/forum/threads/:id", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .delete(forumThreadsTable)
    .where(whereAll(eq(forumThreadsTable.id, id), ownedBy(user, forumThreadsTable.userId)))
    .returning({ id: forumThreadsTable.id });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

router.post("/forum/threads/:threadId/replies", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user || !canPost(user, res)) return;
  const threadId = parseIntParam(req.params.threadId);
  if (threadId === null) {
    res.status(400).json({ error: "Invalid threadId" });
    return;
  }
  const parsed = CreateForumReplyBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const [thread] = await db
    .select()
    .from(forumThreadsTable)
    .where(whereAll(eq(forumThreadsTable.id, threadId), isNull(forumThreadsTable.hiddenAt)));
  if (!thread) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (thread.lockedAt) {
    res.status(403).json({ error: "This discussion is locked" });
    return;
  }
  const [row] = await db.insert(forumRepliesTable).values({
    threadId,
    content: parsed.data.content,
    authorName: user.displayName,
    userId: user.id,
  }).returning();
  await db.update(forumThreadsTable).set({ lastActivityAt: new Date() }).where(eq(forumThreadsTable.id, threadId));
  res.status(201).json(formatReply(row));
});

router.patch("/forum/replies/:id", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = forumReplyUpdateBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const [row] = await db
    .update(forumRepliesTable)
    .set({ content: parsed.data.content })
    .where(whereAll(eq(forumRepliesTable.id, id), ownedBy(user, forumRepliesTable.userId)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatReply(row));
});

router.delete("/forum/replies/:id", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .delete(forumRepliesTable)
    .where(whereAll(eq(forumRepliesTable.id, id), ownedBy(user, forumRepliesTable.userId)))
    .returning({ id: forumRepliesTable.id });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
