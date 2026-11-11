import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/** Public discussion categories. Any signed-in member may post in these. */
export const PUBLIC_FORUM_CATEGORIES = [
  "Sources",
  "Methodology",
  "Translation",
  "Interpretation",
  "Chronology",
] as const;
export type PublicForumCategory = (typeof PUBLIC_FORUM_CATEGORIES)[number];

export const forumThreadsTable = pgTable("forum_threads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  authorName: text("author_name").notNull(),
  tags: text("tags").array().notNull().default([]),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  hiddenAt: timestamp("hidden_at", { withTimezone: true }),
  hiddenByUserId: integer("hidden_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
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
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  threadId: integer("thread_id")
    .notNull()
    .references(() => forumThreadsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  hiddenAt: timestamp("hidden_at", { withTimezone: true }),
  hiddenByUserId: integer("hidden_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
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

export const forumRoomsTable = pgTable("forum_rooms", {
  id: serial("id").primaryKey(),
  ownerUserId: integer("owner_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  hiddenAt: timestamp("hidden_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ForumRoom = typeof forumRoomsTable.$inferSelect;

export const forumRoomMembersTable = pgTable(
  "forum_room_members",
  {
    id: serial("id").primaryKey(),
    roomId: integer("room_id")
      .notNull()
      .references(() => forumRoomsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    memberRole: text("member_role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("forum_room_members_unique").on(table.roomId, table.userId)],
);

export type ForumRoomMember = typeof forumRoomMembersTable.$inferSelect;

export const forumRoomInvitesTable = pgTable("forum_room_invites", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id")
    .notNull()
    .references(() => forumRoomsTable.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull().unique(),
  codeHint: text("code_hint").notNull(),
  createdByUserId: integer("created_by_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ForumRoomInvite = typeof forumRoomInvitesTable.$inferSelect;

export const forumRoomPostsTable = pgTable("forum_room_posts", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id")
    .notNull()
    .references(() => forumRoomsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  hiddenAt: timestamp("hidden_at", { withTimezone: true }),
  hiddenByUserId: integer("hidden_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ForumRoomPost = typeof forumRoomPostsTable.$inferSelect;
