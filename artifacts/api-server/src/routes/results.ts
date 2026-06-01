import { Router } from "express";
import { eq, sql, count, desc, max, avg } from "drizzle-orm";
import { db, resultsTable, gamesTable, usersTable } from "@workspace/db";
import { authGuard, type AuthRequest } from "../middlewares/authGuard";
import { cacheDel } from "../lib/redis";

const router = Router();

router.post("/results", authGuard, async (req: AuthRequest, res): Promise<void> => {
  const { gameId, wpm, accuracy, timeTakenMs } = req.body as {
    gameId?: number;
    wpm?: number;
    accuracy?: number;
    timeTakenMs?: number;
  };

  if (!gameId || wpm == null || accuracy == null || timeTakenMs == null) {
    res.status(400).json({ error: "gameId, wpm, accuracy, and timeTakenMs are required" });
    return;
  }
  if (wpm <= 0) {
    res.status(400).json({ error: "wpm must be greater than 0" });
    return;
  }
  if (accuracy < 0 || accuracy > 100) {
    res.status(400).json({ error: "accuracy must be 0-100" });
    return;
  }
  if (timeTakenMs <= 0) {
    res.status(400).json({ error: "timeTakenMs must be greater than 0" });
    return;
  }

  const [result] = await db
    .insert(resultsTable)
    .values({ userId: req.user!.userId, gameId, wpm, accuracy, timeTakenMs })
    .returning();

  await cacheDel("leaderboard:*");
  res.status(201).json(result);
});

router.get("/results/history", authGuard, async (req: AuthRequest, res): Promise<void> => {
  const page = parseInt(String(req.query["page"] ?? "1"), 10);
  const limit = parseInt(String(req.query["limit"] ?? "10"), 10);
  const offset = (page - 1) * limit;

  const userId = req.user!.userId;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: resultsTable.id,
        userId: resultsTable.userId,
        gameId: resultsTable.gameId,
        wpm: resultsTable.wpm,
        accuracy: resultsTable.accuracy,
        timeTakenMs: resultsTable.timeTakenMs,
        createdAt: resultsTable.createdAt,
        paragraph: gamesTable.paragraph,
        difficulty: gamesTable.difficulty,
        username: usersTable.username,
        personalBestWpm: sql<number | null>`null`,
      })
      .from(resultsTable)
      .innerJoin(gamesTable, eq(gamesTable.id, resultsTable.gameId))
      .innerJoin(usersTable, eq(usersTable.id, resultsTable.userId))
      .where(eq(resultsTable.userId, userId))
      .orderBy(desc(resultsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(resultsTable).where(eq(resultsTable.userId, userId)),
  ]);

  res.json({ data, total: totalResult[0]?.count ?? 0, page, limit });
});

router.get("/results/:id", authGuard, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select({
      id: resultsTable.id,
      userId: resultsTable.userId,
      gameId: resultsTable.gameId,
      wpm: resultsTable.wpm,
      accuracy: resultsTable.accuracy,
      timeTakenMs: resultsTable.timeTakenMs,
      createdAt: resultsTable.createdAt,
      paragraph: gamesTable.paragraph,
      difficulty: gamesTable.difficulty,
      username: usersTable.username,
    })
    .from(resultsTable)
    .innerJoin(gamesTable, eq(gamesTable.id, resultsTable.gameId))
    .innerJoin(usersTable, eq(usersTable.id, resultsTable.userId))
    .where(eq(resultsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  if (row.userId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // Get personal best WPM for this user
  const [pb] = await db
    .select({ bestWpm: max(resultsTable.wpm) })
    .from(resultsTable)
    .where(eq(resultsTable.userId, req.user!.userId));

  res.json({ ...row, personalBestWpm: pb?.bestWpm ?? null });
});

router.get("/stats/me", authGuard, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;

  const [stats] = await db
    .select({
      totalRaces: count(),
      bestWpm: max(resultsTable.wpm),
      avgWpm: avg(resultsTable.wpm),
      avgAccuracy: avg(resultsTable.accuracy),
    })
    .from(resultsTable)
    .where(eq(resultsTable.userId, userId));

  const recentResults = await db
    .select()
    .from(resultsTable)
    .where(eq(resultsTable.userId, userId))
    .orderBy(desc(resultsTable.createdAt))
    .limit(5);

  res.json({
    totalRaces: stats?.totalRaces ?? 0,
    bestWpm: stats?.bestWpm ?? null,
    avgWpm: stats?.avgWpm ?? null,
    avgAccuracy: stats?.avgAccuracy ?? null,
    recentResults,
  });
});

export default router;
