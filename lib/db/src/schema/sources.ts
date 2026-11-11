import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { repositoriesTable } from "./repositories";

export const collectionsTable = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  subject: text("subject").notNull(),
  description: text("description"),
  iconLabel: text("icon_label"),
  featured: boolean("featured").notNull().default(false),
  coverImageUrl: text("cover_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCollectionSchema = createInsertSchema(collectionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collectionsTable.$inferSelect;

export const sourcesTable = pgTable("sources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  sourceType: text("source_type").notNull(), // primary, translation, scholarship, interpretation, conclusion
  collectionSlug: text("collection_slug"),
  repositoryId: integer("repository_id").references(() => repositoriesTable.id),
  repositoryAccessStatus: text("repository_access_status"), // digitized, catalog_only, restricted, physical_access_required
  repositoryAccessNote: text("repository_access_note"),
  author: text("author"),
  dateLabel: text("date_label"),
  language: text("language"),
  originalLanguage: text("original_language"),
  provenance: text("provenance").notNull(),
  confidence: text("confidence").notNull(), // high, medium, low, uncertain
  chronology: text("chronology"),
  availability: text("availability").notNull(), // public_domain, open_access, restricted, fee_required
  rightsStatement: text("rights_statement"),
  description: text("description"),
  excerpt: text("excerpt"),
  originalLanguageText: text("original_language_text"),
  externalUrl: text("external_url"),
  yearApprox: integer("year_approx"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertSourceSchema = createInsertSchema(sourcesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Source = typeof sourcesTable.$inferSelect;
