import { DeviceRule, GeoRule } from "./rules";
import { Request, Response } from "express";
import { Rule, RuleContext } from "../types/rules";
import { getFromCache, getWithCache, saveToCache } from "../lib/redis";

import { get404Template } from "../templates/404";
import { getCountryFromIp } from "../utils/geolocation";
import { getPasswordTemplate } from "../templates/password";
import prisma from "../lib/prisma";
import { buildLocalizedResponse, createTranslator } from "../lib/i18n";

// Add template for password entry page

// Helper function to get user agent and device type
export const getUserAgent = (
  req: Request
): { deviceType: string; userAgent: string } => {
  const userAgent = req.headers["user-agent"] || "";
  if (/ipad|tablet/i.test(userAgent)) {
    return { deviceType: "tablet", userAgent };
  }
  if (/mobile/i.test(userAgent)) {
    return { deviceType: "mobile", userAgent };
  }
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

const attachUtmParameters = (url: string, link: any): string => {
  try {
    const finalUrl = new URL(url);

    // Attach UTM parameters if they exist
    if (link.utmSource) finalUrl.searchParams.set("utm_source", link.utmSource);
    if (link.utmMedium) finalUrl.searchParams.set("utm_medium", link.utmMedium);
    if (link.utmCampaign)
      finalUrl.searchParams.set("utm_campaign", link.utmCampaign);
    if (link.utmTerm) finalUrl.searchParams.set("utm_term", link.utmTerm);
    if (link.utmContent)
      finalUrl.searchParams.set("utm_content", link.utmContent);

    const normalized = finalUrl.toString();
    const originalEndsWithSlash = url.trim().endsWith("/");
    if (
      finalUrl.pathname === "/" &&
      !finalUrl.search &&
      !finalUrl.hash &&
      !originalEndsWithSlash
    ) {
      return normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    // If URL parsing fails, append parameters manually
    const separator = url.includes("?") ? "&" : "?";
    const utmParams = [];

    if (link.utmSource)
      utmParams.push(`utm_source=${encodeURIComponent(link.utmSource)}`);
    if (link.utmMedium)
      utmParams.push(`utm_medium=${encodeURIComponent(link.utmMedium)}`);
    if (link.utmCampaign)
      utmParams.push(`utm_campaign=${encodeURIComponent(link.utmCampaign)}`);
    if (link.utmTerm)
      utmParams.push(`utm_term=${encodeURIComponent(link.utmTerm)}`);
    if (link.utmContent)
      utmParams.push(`utm_content=${encodeURIComponent(link.utmContent)}`);

    return utmParams.length > 0
      ? `${url}${separator}${utmParams.join("&")}`
      : url;
  }
};

// Handle link redirection
export const handleRedirection = async (req: Request, res: Response) => {
  const path = req.params.path;
  console.log(`Processing redirection for path: ${path}`);

  const translator = createTranslator({ req });
  try {
    // Check if link requires password and session is not valid
    let linkData = await getCachedLinkData(path);

    if (!linkData) {
      linkData = await prisma.link.findFirst({
        where: {
          shortCode: path,
          active: true,
        },
        select: {
          id: true,
          isPasswordProtected: true,
          baseUrl: true,
          expiresAt: true,
          rules: {
            select: {
              id: true,
              redirectUrl: true,
              countries: true,
            },
          },
          deviceRules: {
            select: {
              id: true,
              redirectUrl: true,
              deviceType: true,
            },
          },
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          utmTerm: true,
          utmContent: true,
        },
      });

      if (!linkData) {
        throw new Error("Link not found");
      }

      await cacheLinkData(path, linkData);
    }

    const expirationTimestamp = linkData.expiresAt
      ? new Date(linkData.expiresAt).getTime()
      : null;

    if (expirationTimestamp && expirationTimestamp <= Date.now()) {
      return res.status(410).send(get404Template(translator));
    }

    if (linkData.isPasswordProtected) {
      const sessionToken = req.cookies.link_session;
      if (!sessionToken) {
        return res.send(getPasswordTemplate(path, translator));
      }

      const sessionKey = `link_session:${path}:${sessionToken}`;
      const isValid = await getFromCache(sessionKey);
      if (!isValid) {
        return res.send(getPasswordTemplate(path, translator));
      }
    }

    const ip =
      (req.headers["cf-connecting-ip"] as string) || req.ip || "0.0.0.0";
    const { deviceType, userAgent } = getUserAgent(req);

    // Run geolocation check
    const [userCountry, userCity] = await getCountryFromIp(ip);

    const context: RuleContext = {
      userCountry,
      userCity,
      deviceType,
      redirectUrl: linkData.baseUrl,
      matchedRules: [],
    };

    await applyRules(linkData, context);

    // Ensure URL has protocol and attach UTM parameters
    let finalUrl = context.redirectUrl;
    if (!finalUrl.match(/^https?:\/\//i)) {
      finalUrl = `https://${finalUrl}`;
    }

    finalUrl = attachUtmParameters(finalUrl, linkData);

    // Send redirect and record analytics in parallel
    console.log(`Redirecting to: ${finalUrl}`);
    res.redirect(302, finalUrl);

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
      return res.status(404).send(get404Template(translator));
    }
    return res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "common.errors.unexpected", {
          error,
        })
      );
  }
};
