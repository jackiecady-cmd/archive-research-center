import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Translation workspace records — one row per (researcher × source).
 * Each field is a distinct epistemic layer. Layers must never be merged
 * in the UI; AI-generated content must carry an explicit disclaimer.
 */
export const translationsTable = pgTable("translations", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(),

  // ── Source layer (can override excerpt for translation focus) ──────────
  originalText: text("original_text"),

  // ── Linguistic layers ──────────────────────────────────────────────────
  transliteration: text("transliteration"),
  morphologyNotes: text("morphology_notes"),

  // ── Translation layers (strictly ordered by epistemic distance) ────────
  literalTranslation: text("literal_translation"),
  readableTranslation: text("readable_translation"),
  publishedTranslation: text("published_translation"),
  publishedTranslationAttribution: text("published_translation_attribution"),

  // ── Interpretive layers ────────────────────────────────────────────────
  commentary: text("commentary"),
  userInterpretation: text("user_interpretation"),

  // ── AI Assistance (never source evidence) ─────────────────────────────
  aiAssistance: text("ai_assistance"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertTranslationSchema = createInsertSchema(translationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translationsTable.$inferSelect;
