import { Cluster, Redis } from "ioredis";

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
