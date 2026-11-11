import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { sourcesTable } from "./sources";

/**
 * Translation workspace records — one row per (researcher × source).
 * Each field is a distinct epistemic layer. Layers stay separate in the UI.
 * English translations are disclosed with TRANSLATION_DISCLOSURE from
 * @workspace/config. Model and provider names stay out of public responses.
 */
export const translationsTable = pgTable(
  "translations",
  {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  sourceId: integer("source_id")
    .notNull()
    .references(() => sourcesTable.id, { onDelete: "cascade" }),

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

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  },
  (table) => [
    uniqueIndex("translations_user_source_unique").on(table.userId, table.sourceId),
  ],
);

export const insertTranslationSchema = createInsertSchema(translationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translationsTable.$inferSelect;
