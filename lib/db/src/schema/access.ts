import { boolean, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * Single-use by default. Only the hash is stored.
 * `activeKey` is 1 while the delegate row is the one live designation, and null after revoke.
 * A unique index on that column allows many revoked rows and at most one live delegate.
 */
export const compDelegatesTable = pgTable(
  "comp_delegates",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    designatedByUserId: integer("designated_by_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    activeKey: integer("active_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedByUserId: integer("revoked_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  },
  (table) => [uniqueIndex("comp_delegates_one_active").on(table.activeKey)],
);

export type CompDelegate = typeof compDelegatesTable.$inferSelect;

export const compCodesTable = pgTable("comp_codes", {
  id: serial("id").primaryKey(),
  codeHash: text("code_hash").notNull().unique(),
  codeHint: text("code_hint").notNull(),
  label: text("label"),
  singleUse: boolean("single_use").notNull().default(true),
  createdByUserId: integer("created_by_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokedByUserId: integer("revoked_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
});

export type CompCode = typeof compCodesTable.$inferSelect;

export const compRedemptionsTable = pgTable("comp_redemptions", {
  id: serial("id").primaryKey(),
  codeId: integer("code_id")
    .notNull()
    .references(() => compCodesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokedByUserId: integer("revoked_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
});

export type CompRedemption = typeof compRedemptionsTable.$inferSelect;

/**
 * `activeUserId` is the user id while the grant is live and null after revoke.
 * Unique, so a person can hold only one live comp. Revoked rows do not collide.
 */
export const compGrantsTable = pgTable("comp_grants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  redemptionId: integer("redemption_id")
    .notNull()
    .references(() => compRedemptionsTable.id, { onDelete: "cascade" }),
  activeUserId: integer("active_user_id").unique(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokedByUserId: integer("revoked_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
});

export type CompGrant = typeof compGrantsTable.$inferSelect;

export const serviceTokensTable = pgTable("service_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  createdByUserId: integer("created_by_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export type ServiceToken = typeof serviceTokensTable.$inferSelect;

export const moderationEventsTable = pgTable("moderation_events", {
  id: serial("id").primaryKey(),
  actorUserId: integer("actor_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ModerationEvent = typeof moderationEventsTable.$inferSelect;
