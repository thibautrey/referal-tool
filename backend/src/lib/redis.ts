import { Cluster, Redis } from "ioredis";
// In-memory LRU cache for frequently accessed links
import LRU from "lru-cache";

const redisNodes = (process.env.REDIS_URL || "redis://localhost:6379")
  .split(",")
  .map((url) => {
    const parsedUrl = new URL(url);
    return {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port || "6379"),
    };
  });

export const redis =
  redisNodes.length > 1
    ? new Cluster(redisNodes, {
        redisOptions: {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
        clusterRetryStrategy: (times) => {
          const delay = Math.min(100 + times * 2, 2000);
          return delay;
        },
      })
    : new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });

redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});

redis.on("connect", () => {
  console.log("Connected to Redis" + (redisNodes.length > 1 ? " cluster" : ""));
});

// Cache duration in seconds (1 hour)
export const CACHE_DURATION = 60 * 60;

/**
 * Retrieves a value from cache
 * @param key Cache key
 * @returns Value or null if not found
 */
export async function getFromCache(key: string): Promise<any> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error retrieving from cache:", error);
    return null;
  }
}

/**
 * Saves a value to cache
 * @param key Cache key
 * @param value Value to store
 * @param expireInSeconds Expiration duration in seconds (default: 1 hour)
 */
export async function saveToCache(
  key: string,
  value: any,
  expireInSeconds = CACHE_DURATION
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", expireInSeconds);
  } catch (error) {
    console.error("Error saving to cache:", error);
  }
}

const memoryCache = new LRU<string, any>({
  max: 500, // Store max 500 items
  ttl: 1000 * 60 * 2, // Cache for 2 minutes in memory
  updateAgeOnGet: true,
});

export async function getWithCache<T>(
  key: string,
  redisGetter: () => Promise<T | null>
): Promise<T | null> {
  // First check memory cache
  const memCached = memoryCache.get(key);
  if (memCached) return memCached as T;

  // Then check Redis
  const redisCached = await redisGetter();
  if (redisCached) {
    memoryCache.set(key, redisCached);
  }

  return redisCached;
}
