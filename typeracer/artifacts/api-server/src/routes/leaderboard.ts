import { Router } from "express";
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

  // Show all race results sorted by WPM (multiple entries per user)
  let query: string;
  let params: (string | number)[];

  if (validDifficulty === "all") {
    query = `
      SELECT
        u.username,
        r.wpm,
        r.accuracy,
        g.difficulty,
        r.created_at AS raced_at
      FROM results r
      JOIN users u ON u.id = r.user_id
      JOIN games g ON g.id = r.game_id
      ORDER BY r.wpm DESC
      LIMIT $1
    `;
    params = [validLimit];
  } else {
    query = `
      SELECT
        u.username,
        r.wpm,
        r.accuracy,
        g.difficulty,
        r.created_at AS raced_at
      FROM results r
      JOIN users u ON u.id = r.user_id
      JOIN games g ON g.id = r.game_id
      WHERE g.difficulty = $1
      ORDER BY r.wpm DESC
      LIMIT $2
    `;
    params = [validDifficulty, validLimit];
  }

  const result = await pool.query(query, params);

  const entries = result.rows.map((row: { username: string; wpm: number; accuracy: number; difficulty: string; raced_at: Date }, i: number) => ({
    rank: i + 1,
    username: row.username,
    wpm: row.wpm,
    accuracy: row.accuracy,
    difficulty: row.difficulty,
    racedAt: row.raced_at,
  }));

  await cacheSet(cacheKey, JSON.stringify(entries), 60);
  res.json(entries);
});

export default router;
