import { Request, Response } from "express";
import { getFromCache, getWithCache, saveToCache } from "../lib/redis";
import { get404Template } from "../templates/404";
import { getCountryFromIp } from "../utils/geolocation";
import prisma from "../lib/prisma";
import { Rule, RuleContext } from "../types/rules";
import { DeviceRule, GeoRule } from "./rules";

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

async function applyRules(linkData: any, context: RuleContext): Promise<void> {
  const rules: Rule[] = [
    ...linkData.rules.map((r: any) => new GeoRule(r)),
    ...linkData.deviceRules.map((r: any) => new DeviceRule(r)),
  ].sort((a, b) => b.priority - a.priority);

  for (const rule of rules) {
    try {
      await rule.execute(context);
    } catch (error) {
      if (error instanceof Error && error.message === "STOP_CHAIN") {
        break;
      }
      throw error;
    }
  }
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

    const context: RuleContext = {
      userCountry,
      userCity,
      deviceType,
      redirectUrl: linkData.baseUrl,
      matchedRules: [],
    };

    await applyRules(linkData, context);

    // Ensure URL has protocol
    if (!context.redirectUrl.match(/^https?:\/\//i)) {
      context.redirectUrl = `https://${context.redirectUrl}`;
    }

    // Send redirect and record analytics in parallel
    console.log(`Redirecting to: ${context.redirectUrl}`);
    res.redirect(302, context.redirectUrl);

    // Record analytics asynchronously
    try {
      // Verify link exists before creating visit
      const link = await prisma.link.findUnique({
        where: { id: linkData.id },
        select: { id: true },
      });

      if (!link) {
        throw new Error(`Link with ID ${linkData.id} not found`);
      }

      // Verify rule IDs if they exist
      if (context.matchedRules.length > 0) {
        for (const rule of context.matchedRules) {
          const ruleRecord = await prisma.linkRule.findUnique({
            where: { id: parseInt(rule.id) },
            select: { id: true },
          });
          if (!ruleRecord) {
            context.matchedRules = context.matchedRules.filter(
              (r) => r.id !== rule.id
            );
          }
        }
      }

      await prisma.linkVisit.create({
        data: {
          linkId: linkData.id,
          ip,
          country: userCountry || "unknown",
          city: userCity || "unknown",
          ruleId:
            context.matchedRules.length > 0
              ? parseInt(context.matchedRules[0].id)
              : null,
          deviceRuleId:
            context.matchedRules.length > 1
              ? parseInt(context.matchedRules[1].id)
              : null,
          userAgent,
          deviceType,
        },
      });

      console.log(`Analytics recorded for ${path}`);
    } catch (error) {
      console.error("Error in async analytics processing:", error);
      // Don't throw the error since analytics are non-critical
    }
  } catch (error: unknown) {
    console.error("Redirection error:", error);
    if (error instanceof Error && error.message === "Link not found") {
      return res.status(404).send(get404Template());
    }
    return res.status(500).json({ message: "Error handling redirection" });
  }
};
