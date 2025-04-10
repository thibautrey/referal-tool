import { Request, Response } from "express";
import { getFromCache, getWithCache, saveToCache } from "../lib/redis";
import { get404Template } from "../templates/404";
import { getCountryFromIp } from "../utils/geolocation";
import prisma from "../lib/prisma";

// Helper function to get user agent and device type
export const getUserAgent = (
  req: Request
): { deviceType: string; userAgent: string } => {
  const userAgent = req.headers["user-agent"] || "";
  if (/mobile/i.test(userAgent)) return { deviceType: "mobile", userAgent };
  if (/tablet/i.test(userAgent)) return { deviceType: "tablet", userAgent };
  return { deviceType: "desktop", userAgent };
};

interface CachedLink {
  data: any;
  timestamp: number;
}

async function getCachedLinkData(shortCode: string): Promise<any | null> {
  const linkCacheKey = `link:${shortCode}`;

  // Utiliser le cache en mémoire + Redis
  return getWithCache(linkCacheKey, async () => {
    const cached = await getFromCache(linkCacheKey);

    if (!cached) return null;

    try {
      const parsedCache: CachedLink = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid (30 minutes instead of 10)
      if (now - parsedCache.timestamp <= 30 * 60 * 1000) {
        // Only update timestamp every 5 minutes instead of every minute
        if (now - parsedCache.timestamp > 5 * 60 * 1000) {
          // Update asynchronously with a lower priority
          setTimeout(() => {
            saveToCache(
              linkCacheKey,
              JSON.stringify({ ...parsedCache, timestamp: now }),
              3600 // Augmenter TTL à 1 heure
            ).catch((err) =>
              console.error(`Cache update error for ${shortCode}:`, err)
            );
          }, 10); // Délai de 10ms pour prioriser la réponse utilisateur
        }
        return parsedCache.data;
      }
    } catch (e) {
      console.error(`Cache parse error for ${shortCode}:`, e);
      return null;
    }

    return null;
  });
}

async function cacheLinkData(shortCode: string, data: any): Promise<void> {
  const linkCacheKey = `link:${shortCode}`;
  const cacheData: CachedLink = {
    data,
    timestamp: Date.now(),
  };
  await saveToCache(linkCacheKey, JSON.stringify(cacheData), 600);
}

// Handle link redirection
export const handleRedirection = async (req: Request, res: Response) => {
  const path = req.params.path;
  console.log(`Processing redirection for path: ${path}`);

  try {
    const ip =
      (req.headers["cf-connecting-ip"] as string) || req.ip || "0.0.0.0";

    const { deviceType, userAgent } = getUserAgent(req);

    // Run cache check and geolocation in parallel since they're independent
    const [linkData, [userCountry, userCity]] = await Promise.all([
      getCachedLinkData(path).then(async (cached) => {
        if (cached) {
          console.log(`Cache hit for ${path}`);
          return cached;
        }
        // If not in cache, fetch from database
        console.log(`Cache miss for ${path}, fetching from database`);
        const freshLinkData = await prisma.link.findFirst({
          where: {
            shortCode: path,
            active: true,
          },
          include: {
            rules: true,
            deviceRules: true,
          },
        });

        if (!freshLinkData) {
          throw new Error("Link not found");
        }

        // Cache the fresh data
        await cacheLinkData(path, freshLinkData);
        return freshLinkData;
      }),
      (async () => {
        const result = await getCountryFromIp(ip);
        return result;
      })(),
    ]);

    const now = new Date();

    // 1. Check geo rules first
    let redirectUrl = linkData.baseUrl;
    let matchingRule = null;
    let matchingDeviceRule = null;

    // Priority 1: Check geographic rules first
    // If a geo rule matches, it takes precedence over device rules
    const geoRule = linkData.rules?.find(
      (rule: { countries: string; startDate?: Date; endDate?: Date }) => {
        const countries: string[] = JSON.parse(rule.countries);
        const isCountryMatch = countries.includes(userCountry);

        return isCountryMatch;
      }
    );

    // Priority 2: Check device rules only if no geo rule matched
    if (!geoRule) {
      matchingDeviceRule = linkData.deviceRules?.find(
        (rule: { deviceType: string; startDate?: Date; endDate?: Date }) => {
          const isDeviceMatch =
            rule.deviceType === "all" || rule.deviceType === deviceType;

          return isDeviceMatch;
        }
      );
    }

    // Apply the highest priority matching rule
    if (geoRule) {
      console.log(`Matched priority 1 (geo rule) for ${userCountry}`);
      redirectUrl = geoRule.redirectUrl;
      matchingRule = geoRule;
    } else if (matchingDeviceRule) {
      console.log(`Matched priority 2 (device rule) for ${deviceType}`);
      redirectUrl = matchingDeviceRule.redirectUrl;
    } else {
      console.log(`No rules matched, using base URL`);
    }

    // Ensure URL has protocol
    if (!redirectUrl.match(/^https?:\/\//i)) {
      redirectUrl = `https://${redirectUrl}`;
    }

    // Send redirect and record analytics in parallel
    console.log(`Redirecting to: ${redirectUrl}`);
    res.redirect(302, redirectUrl);

    // Record analytics asynchronously
    prisma.linkVisit
      .create({
        data: {
          linkId: linkData.id,
          ip,
          country: userCountry,
          city: userCity,
          ruleId: matchingRule?.id || null,
          deviceRuleId: matchingDeviceRule?.id || null,
          userAgent,
          deviceType,
        },
      })
      .then(() => {
        // Async operation completed
      })
      .catch((error) => {
        console.error("Error in async analytics processing:", error);
      });
  } catch (error: unknown) {
    console.error("Redirection error:", error);
    if (error instanceof Error && error.message === "Link not found") {
      return res.status(404).send(get404Template());
    }
    return res.status(500).json({ message: "Error handling redirection" });
  }
};
