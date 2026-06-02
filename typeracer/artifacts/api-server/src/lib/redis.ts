import Redis from "ioredis";
import { logger } from "./logger";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let redisClient: Redis | null = null;
let redisUnavailable = false;

export function getRedis(): Redis | null {
  if (redisUnavailable) return null;
  if (redisClient) return redisClient;

  try {
    const client = new Redis(REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0,
      connectTimeout: 2000,
      retryStrategy: () => null,
    });

    client.on("error", () => {
      if (!redisUnavailable) {
        logger.warn("Redis unavailable — leaderboard cache disabled, falling back to PostgreSQL");
        redisUnavailable = true;
      }
      redisClient = null;
      client.disconnect();
    });

    redisClient = client;
    return client;
  } catch {
    redisUnavailable = true;
    return null;
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  if (redisUnavailable) return null;
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (redisUnavailable) return;
  const client = getRedis();
  if (!client) return;
  try {
    await client.setex(key, ttlSeconds, value);
  } catch {
    // silently ignore
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  if (redisUnavailable) return;
  const client = getRedis();
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    // silently ignore
  }
}
