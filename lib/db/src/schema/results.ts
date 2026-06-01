import { pgTable, integer, serial, timestamp, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { gamesTable } from "./games";

export const resultsTable = pgTable("results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  gameId: integer("game_id").notNull().references(() => gamesTable.id),
  wpm: real("wpm").notNull(),
  accuracy: real("accuracy").notNull(),
  timeTakenMs: integer("time_taken_ms").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_results_user_id").on(t.userId),
  index("idx_results_wpm").on(t.wpm),
  index("idx_results_game_id").on(t.gameId),
]);

export const insertResultSchema = createInsertSchema(resultsTable).omit({ id: true, createdAt: true });
export type InsertResult = z.infer<typeof insertResultSchema>;
export type Result = typeof resultsTable.$inferSelect;
