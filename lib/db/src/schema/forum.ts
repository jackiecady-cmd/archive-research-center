import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const forumThreadsTable = pgTable("forum_threads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  authorName: text("author_name").notNull(),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertForumThreadSchema = createInsertSchema(forumThreadsTable).omit({
  id: true,
  createdAt: true,
  lastActivityAt: true,
});
export type InsertForumThread = z.infer<typeof insertForumThreadSchema>;
export type ForumThread = typeof forumThreadsTable.$inferSelect;

export const forumRepliesTable = pgTable("forum_replies", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull(),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertForumReplySchema = createInsertSchema(forumRepliesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;
export type ForumReply = typeof forumRepliesTable.$inferSelect;
