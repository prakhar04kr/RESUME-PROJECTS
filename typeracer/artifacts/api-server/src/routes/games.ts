import { Router } from "express";
import { eq, sql, count } from "drizzle-orm";
import { db, gamesTable } from "@workspace/db";
import { authGuard, adminOnly, type AuthRequest } from "../middlewares/authGuard";
import { cacheDel } from "../lib/redis";

const router = Router();

router.get("/games/random", async (req: AuthRequest, res): Promise<void> => {
  const difficulty = req.query["difficulty"] as string | undefined;

  let query = db.select().from(gamesTable);
  if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
    const filtered = await db
      .select()
      .from(gamesTable)
      .where(eq(gamesTable.difficulty, difficulty as "easy" | "medium" | "hard"))
      .orderBy(sql`RANDOM()`)
      .limit(1);
    if (filtered.length === 0) {
      res.status(404).json({ error: "No games found" });
      return;
    }
    res.json(filtered[0]);
    return;
  }

  const games = await query.orderBy(sql`RANDOM()`).limit(1);
  if (games.length === 0) {
    res.status(404).json({ error: "No games found" });
    return;
  }
  res.json(games[0]);
});

router.get("/games", authGuard, adminOnly, async (req: AuthRequest, res): Promise<void> => {
  const page = parseInt(String(req.query["page"] ?? "1"), 10);
  const limit = parseInt(String(req.query["limit"] ?? "20"), 10);
  const offset = (page - 1) * limit;

  const [data, totalResult] = await Promise.all([
    db.select().from(gamesTable).orderBy(sql`${gamesTable.createdAt} DESC`).limit(limit).offset(offset),
    db.select({ count: count() }).from(gamesTable),
  ]);

  res.json({ data, total: totalResult[0]?.count ?? 0, page, limit });
});

router.post("/games", authGuard, adminOnly, async (req: AuthRequest, res): Promise<void> => {
  const { paragraph, difficulty } = req.body as { paragraph?: string; difficulty?: string };

  if (!paragraph || typeof paragraph !== "string") {
    res.status(400).json({ error: "paragraph is required" });
    return;
  }
  if (paragraph.length < 80 || paragraph.length > 500) {
    res.status(400).json({ error: "paragraph must be 80-500 characters" });
    return;
  }
  if (!difficulty || !["easy", "medium", "hard"].includes(difficulty)) {
    res.status(400).json({ error: "difficulty must be easy, medium, or hard" });
    return;
  }

  const [game] = await db
    .insert(gamesTable)
    .values({ paragraph, difficulty: difficulty as "easy" | "medium" | "hard", createdBy: req.user!.userId })
    .returning();

  await cacheDel("leaderboard:*");
  res.status(201).json(game);
});

router.patch("/games/:id", authGuard, adminOnly, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { paragraph, difficulty } = req.body as { paragraph?: string; difficulty?: string };
  const updates: Partial<{ paragraph: string; difficulty: "easy" | "medium" | "hard" }> = {};

  if (paragraph !== undefined) {
    if (paragraph.length < 80 || paragraph.length > 500) {
      res.status(400).json({ error: "paragraph must be 80-500 characters" });
      return;
    }
    updates.paragraph = paragraph;
  }
  if (difficulty !== undefined) {
    if (!["easy", "medium", "hard"].includes(difficulty)) {
      res.status(400).json({ error: "difficulty must be easy, medium, or hard" });
      return;
    }
    updates.difficulty = difficulty as "easy" | "medium" | "hard";
  }

  const [game] = await db.update(gamesTable).set(updates).where(eq(gamesTable.id, id)).returning();
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  await cacheDel("leaderboard:*");
  res.json(game);
});

router.delete("/games/:id", authGuard, adminOnly, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [game] = await db.delete(gamesTable).where(eq(gamesTable.id, id)).returning();
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  await cacheDel("leaderboard:*");
  res.sendStatus(204);
});

export default router;
