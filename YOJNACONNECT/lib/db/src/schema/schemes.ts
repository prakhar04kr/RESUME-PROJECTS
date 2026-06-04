import { pgTable, text, integer, boolean, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const schemesTable = pgTable("schemes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameHindi: text("name_hindi").notNull(),
  ministry: text("ministry").notNull(),
  ageGroups: jsonb("age_groups").$type<string[]>().notNull().default([]),
  sectors: jsonb("sectors").$type<string[]>().notNull().default([]),
  incomeLimit: integer("income_limit"),
  categories: jsonb("categories").$type<string[]>().notNull().default([]),
  benefit: text("benefit").notNull(),
  description: text("description").notNull(),
  eligibility: jsonb("eligibility").$type<string[]>().notNull().default([]),
  documents: jsonb("documents").$type<string[]>().notNull().default([]),
  howToApply: text("how_to_apply").notNull(),
  officialLink: text("official_link").notNull(),
  deadline: text("deadline"),
  termsAndConditions: jsonb("terms_and_conditions").$type<string[]>().notNull().default([]),
  isState: boolean("is_state").notNull().default(false),
  state: text("state"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  popularityScore: integer("popularity_score").notNull().default(50),
});

export const insertSchemeSchema = createInsertSchema(schemesTable).omit({});
export type InsertScheme = z.infer<typeof insertSchemeSchema>;
export type Scheme = typeof schemesTable.$inferSelect;

export const sectorsTable = pgTable("sectors", {
  id: serial("id").primaryKey(),
  sectorId: text("sector_id").notNull().unique(),
  name: text("name").notNull(),
  nameHindi: text("name_hindi").notNull(),
  ageGroups: jsonb("age_groups").$type<string[]>().notNull().default([]),
  icon: text("icon").notNull(),
});

export const insertSectorSchema = createInsertSchema(sectorsTable).omit({ id: true });
export type InsertSector = z.infer<typeof insertSectorSchema>;
export type Sector = typeof sectorsTable.$inferSelect;
