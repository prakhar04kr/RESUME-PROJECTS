import { Router } from "express";
import { sql } from "drizzle-orm";
import { pool } from "@workspace/db";
import { cacheGet, cacheSet } from "../lib/redis";

const router = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const difficulty = String(req.query["difficulty"] ?? "all");
  const limit = parseInt(String(req.query["limit"] ?? "50"), 10);

  const validDifficulty = ["all", "easy", "medium", "hard"].includes(difficulty) ? difficulty : "all";
  const validLimit = Math.min(Math.max(limit, 1), 100);

  const cacheKey = `leaderboard:${validDifficulty}:${validLimit}`;

  const cached = await cacheGet(cacheKey);
  if (cached) {
    res.json(JSON.parse(cached));
    return;
  }

  // Best WPM per user using raw SQL (DISTINCT ON is PostgreSQL-specific)
  let query: string;
  let params: (string | number)[];

  if (validDifficulty === "all") {
    query = `
      SELECT DISTINCT ON (r.user_id)
        u.username,
        r.wpm,
        r.accuracy,
        g.difficulty
      FROM results r
      JOIN users u ON u.id = r.user_id
      JOIN games g ON g.id = r.game_id
      ORDER BY r.user_id, r.wpm DESC
    `;
    params = [];
  } else {
    query = `
      SELECT DISTINCT ON (r.user_id)
        u.username,
        r.wpm,
        r.accuracy,
        g.difficulty
      FROM results r
      JOIN users u ON u.id = r.user_id
      JOIN games g ON g.id = r.game_id
      WHERE g.difficulty = $1
      ORDER BY r.user_id, r.wpm DESC
    `;
    params = [validDifficulty];
  }

  const wrapQuery = `
    SELECT username, wpm, accuracy, difficulty
    FROM (${query}) sub
    ORDER BY wpm DESC
    LIMIT ${validLimit}
  `;

  const result = await pool.query(wrapQuery, params);

  const entries = result.rows.map((row: { username: string; wpm: number; accuracy: number; difficulty: string }, i: number) => ({
    rank: i + 1,
    username: row.username,
    wpm: row.wpm,
    accuracy: row.accuracy,
    difficulty: row.difficulty,
  }));

  await cacheSet(cacheKey, JSON.stringify(entries), 60);
  res.json(entries);
});

export default router;
