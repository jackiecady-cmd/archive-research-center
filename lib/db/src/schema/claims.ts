import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const claimCardsTable = pgTable("claim_cards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  claim: text("claim").notNull(),
  status: text("status").notNull(), // supported, contested, uncertain, refuted
  projectId: integer("project_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertClaimCardSchema = createInsertSchema(claimCardsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClaimCard = z.infer<typeof insertClaimCardSchema>;
export type ClaimCard = typeof claimCardsTable.$inferSelect;

export const evidenceTable = pgTable("evidence", {
  id: serial("id").primaryKey(),
  claimCardId: integer("claim_card_id").notNull(),
  sourceId: integer("source_id").notNull(),
  role: text("role").notNull(), // supports, contradicts, contextualizes, neutral
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertEvidenceSchema = createInsertSchema(evidenceTable).omit({
  id: true,
  createdAt: true,
});
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type Evidence = typeof evidenceTable.$inferSelect;
