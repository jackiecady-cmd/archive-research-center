import { Router } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, forumThreadsTable, forumRepliesTable } from "@workspace/db";
import { CreateForumThreadBody, CreateForumReplyBody } from "@workspace/api-zod";

const router = Router();

function formatThread(row: typeof forumThreadsTable.$inferSelect, replyCount = 0) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    authorName: row.authorName,
    replyCount,
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
    lastActivityAt: row.lastActivityAt.toISOString(),
  };
}

// GET /forum/recent
router.get("/forum/recent", async (req, res): Promise<void> => {
  const [threads, replies] = await Promise.all([
    db.select().from(forumThreadsTable).orderBy(desc(forumThreadsTable.lastActivityAt)).limit(5),
    db.select().from(forumRepliesTable).orderBy(desc(forumRepliesTable.createdAt)).limit(5),
  ]);
  res.json({
    recentThreads: threads.map((t) => formatThread(t)),
    recentReplies: replies.map((r) => ({
      id: r.id, threadId: r.threadId, content: r.content,
      authorName: r.authorName, createdAt: r.createdAt.toISOString(),
    })),
  });
});

// GET /forum/threads
router.get("/forum/threads", async (req, res): Promise<void> => {
  const category = req.query.category as string | undefined;
  const rows = category
    ? await db.select().from(forumThreadsTable).where(eq(forumThreadsTable.category, category)).orderBy(desc(forumThreadsTable.lastActivityAt))
    : await db.select().from(forumThreadsTable).orderBy(desc(forumThreadsTable.lastActivityAt));

  // Get reply counts
  const threadIds = rows.map((r) => r.id);
  const replyCounts: Record<number, number> = {};
  if (threadIds.length) {
    const counts = await db
      .select({ threadId: forumRepliesTable.threadId, count: sql<number>`count(*)::int` })
      .from(forumRepliesTable)
      .where(sql`${forumRepliesTable.threadId} = ANY(ARRAY[${sql.join(threadIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
      .groupBy(forumRepliesTable.threadId);
    for (const c of counts) replyCounts[c.threadId] = c.count;
  }

  res.json(rows.map((t) => formatThread(t, replyCounts[t.id] ?? 0)));
});

// POST /forum/threads
router.post("/forum/threads", async (req, res): Promise<void> => {
  const parsed = CreateForumThreadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(forumThreadsTable).values(parsed.data).returning();
  res.status(201).json(formatThread(row));
});

// GET /forum/threads/:id
router.get("/forum/threads/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [thread] = await db.select().from(forumThreadsTable).where(eq(forumThreadsTable.id, id));
  if (!thread) { res.status(404).json({ error: "Not found" }); return; }
  const replies = await db.select().from(forumRepliesTable).where(eq(forumRepliesTable.threadId, id)).orderBy(forumRepliesTable.createdAt);
  res.json({
    thread: formatThread(thread, replies.length),
    replies: replies.map((r) => ({
      id: r.id, threadId: r.threadId, content: r.content,
      authorName: r.authorName, createdAt: r.createdAt.toISOString(),
    })),
  });
});

// POST /forum/threads/:threadId/replies
router.post("/forum/threads/:threadId/replies", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.threadId) ? req.params.threadId[0] : req.params.threadId;
  const threadId = parseInt(raw, 10);
  if (isNaN(threadId)) { res.status(400).json({ error: "Invalid threadId" }); return; }
  const parsed = CreateForumReplyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(forumRepliesTable).values({ threadId, ...parsed.data }).returning();
  // Update thread lastActivityAt
  await db.update(forumThreadsTable).set({ lastActivityAt: new Date() }).where(eq(forumThreadsTable.id, threadId));
  res.status(201).json({
    id: row.id, threadId: row.threadId, content: row.content,
    authorName: row.authorName, createdAt: row.createdAt.toISOString(),
  });
});

export default router;
