import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const USER_ROLES = ["user", "editor", "moderator", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_KINDS = ["human", "service"] as const;
export type AccountKind = (typeof ACCOUNT_KINDS)[number];

/** What a future billing provider may set. Comp access is a separate grant and overrides this. */
export const BILLING_ENTITLEMENTS = ["free", "paid"] as const;
export type BillingEntitlement = (typeof BILLING_ENTITLEMENTS)[number];
export type EffectiveEntitlement = BillingEntitlement | "comp";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("user"),
  accountKind: text("account_kind").notNull().default("human"),
  billingEntitlement: text("billing_entitlement").notNull().default("free"),
  forumSuspendedAt: timestamp("forum_suspended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
