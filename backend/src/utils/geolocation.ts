import { getFromCache, saveToCache } from "../lib/redis";

import { IPinfoWrapper } from "node-ipinfo";
import prisma from "../lib/prisma";

const IPINFO_TOKEN = process.env.IPINFO_TOKEN || "";
const ipinfoWrapper = new IPinfoWrapper(IPINFO_TOKEN);

const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMsg: string
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMsg));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

export async function getCountryFromIp(ip: string): Promise<[string, string]> {
  try {
    // Check cache first
    const cacheKey = `geolocation:${ip}`;
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      return [cachedData.country, cachedData.city];
    }

    const now = new Date();

    const cachedEntry = await prisma.ipCountryCache.findUnique({
      where: { ip },
    });

    if (cachedEntry && cachedEntry.expiresAt > now) {
      return [cachedEntry.countryCode, cachedEntry.city || "Unknown"];
    }

    const ipinfo = await withTimeout(
      ipinfoWrapper.lookupIp(ip),
      3000,
      "IPInfo lookup timed out"
    );

    const countryCode = ipinfo.countryCode || "UNKNOWN";
    const city = ipinfo.city || "Unknown";

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    prisma.ipCountryCache
      .upsert({
        where: { ip },
        update: { countryCode, city, expiresAt, updatedAt: now },
        create: { ip, countryCode, city, expiresAt },
      })
      .catch((err) => console.error("Error updating IP cache:", err));

    // Cache the result for 24 hours (86400 seconds)
    await saveToCache(cacheKey, { country: countryCode, city }, 86400);

    return [countryCode, city];
  } catch (error) {
    console.error("Error getting country from IP:", error);
    return ["unknown", "unknown"];
  }
}
