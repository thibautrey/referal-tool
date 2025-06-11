import { Request, Response } from "express";
import { deleteFromCache, getFromCache, saveToCache } from "../lib/redis";

import prisma from "../lib/prisma";

// Function to generate a random short code
const generateRandomCode = (length: number = 4): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Check if a short code is available
export const checkShortCodeAvailability = async (
  req: Request,
  res: Response
) => {
  try {
    const { code } = req.params;

    if (!code || code.trim() === "") {
      return res.json({ available: false });
    }

    const existingLink = await prisma.link.findUnique({
      where: { shortCode: code },
    });

    // Add logs for debugging
    console.log(`Checking short code: ${code}, exists: ${!!existingLink}`);

    // If existingLink is null, the code is available
    return res.json({ data: { available: !existingLink } });
  } catch (error: unknown) {
    console.error("Error checking short code availability:", error);
    return res
      .status(500)
      .json({ error: "Failed to check short code availability" });
  }
};

// Get all links for a project
export const getLinksByProject = async (req: Request, res: Response) => {
  console.log("[DEBUG] Entering getLinksByProject function");
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    let sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

    console.log("[DEBUG] Request parameters:", {
      projectId,
      userId,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Valider le champ de tri pour éviter les erreurs de Prisma
    const validSortFields = [
      "id",
      "name",
      "baseUrl",
      "shortCode",
      "projectId",
      "active",
      "createdAt",
      "updatedAt",
    ];

    // Si le champ de tri n'est pas valide, utiliser createdAt par défaut
    if (!validSortFields.includes(sortBy)) {
      console.log(
        `[DEBUG] Invalid sort field: ${sortBy}, falling back to createdAt`
      );
      sortBy = "createdAt";
    }

    if (!projectId) {
      console.log("[DEBUG] Missing projectId parameter");
      return res.status(400).json({ message: "Project ID is required" });
    }

    // Verify project ownership
    console.log(
      `[DEBUG] Verifying project ownership for projectId: ${projectId}, userId: ${userId}`
    );
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        ...(isAdmin ? {} : { userId: userId }),
      },
    });
    console.log(
      "[DEBUG] Project query result:",
      project ? "Found" : "Not Found"
    );

    if (!project) {
      console.log(
        `[DEBUG] Project not found or unauthorized access. ProjectID: ${projectId}, UserID: ${userId}`
      );
      return res
        .status(404)
        .json({ message: "Projet non trouvé ou accès non autorisé" });
    }

    // Get total count
    console.log(`[DEBUG] Getting total link count for projectId: ${projectId}`);
    const total = await prisma.link.count({
      where: {
        projectId: parseInt(projectId),
      },
    });
    console.log(`[DEBUG] Total links found: ${total}`);

    const totalPages = Math.ceil(total / limit);
    console.log(`[DEBUG] Calculated total pages: ${totalPages}`);

    // Get paginated links with sorting
    console.log(
      `[DEBUG] Fetching paginated links with: page=${page}, limit=${limit}, sortBy=${sortBy}, sortOrder=${sortOrder}`
    );
    const links = await prisma.link.findMany({
      where: {
        projectId: parseInt(projectId),
      },
      include: {
        rules: true,
        _count: {
          select: {
            LinkVisit: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });
    console.log(`[DEBUG] Links fetched: ${links.length}`);

    const response = {
      message: "Links retrieved successfully",
      data: {
        links,
        page,
        totalPages,
        sortBy,
        sortOrder,
      },
    };
    console.log("[DEBUG] Sending successful response");
    return res.json(response);
  } catch (error: unknown) {
    console.error("[ERROR] Error in getLinksByProject:", error);
    console.error(
      "[ERROR] Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    // Log more details about the error
    if (error instanceof Error) {
      console.error("[ERROR] Error name:", error.name);
      console.error("[ERROR] Error message:", error.message);
    }

    // If it's a Prisma error, it might have additional details
    if (typeof error === "object" && error !== null && "meta" in error) {
      console.error("[ERROR] Prisma error metadata:", error.meta);
    }

    return res.status(500).json({ message: "Error retrieving links" });
  }
};

// Create a new link with a short code
export const createLink = async (req: Request, res: Response) => {
  try {
    const {
      name,
      baseUrl,
      shortCode,
      rules,
      deviceRules,
      isPasswordProtected,
      password,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
    } = req.body;
    const projectId = parseInt(
      req.params.projectId || (req.headers["x-project-id"] as string)
    );

    // Validate required fields
    if (!name || !baseUrl) {
      return res.status(400).json({ error: "Name and base URL are required" });
    }

    // Validate password if protection is enabled
    if (isPasswordProtected === true) {
      if (!password) {
        return res.status(400).json({
          error: "Password is required when password protection is enabled",
        });
      }
      if (password.length < 6) {
        return res.status(400).json({
          error: "Password must be at least 6 characters long",
        });
      }
    }

    // Generate or validate short code
    let finalShortCode = shortCode;
    if (!finalShortCode) {
      let isUnique = false;
      while (!isUnique) {
        finalShortCode = generateRandomCode();
        const existingLink = await prisma.link.findUnique({
          where: { shortCode: finalShortCode },
        });
        isUnique = !existingLink;
      }
    } else {
      const existingLink = await prisma.link.findUnique({
        where: { shortCode: finalShortCode },
      });

      if (existingLink) {
        return res.status(400).json({ error: "Short code already in use" });
      }
    }

    // Hash password if provided and protection is enabled
    let passwordHash = null;
    if (isPasswordProtected && password) {
      const bcrypt = require("bcrypt");
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Create link with its short code and UTM parameters
    const link = await prisma.link.create({
      data: {
        name,
        baseUrl,
        shortCode: finalShortCode,
        projectId,
        isPasswordProtected: isPasswordProtected === true,
        passwordHash,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
      },
    });

    // Handle geo rules
    if (rules && Array.isArray(rules)) {
      await prisma.linkRule.createMany({
        data: rules.map((rule) => ({
          redirectUrl: rule.redirectUrl,
          countries: JSON.stringify(rule.countries),
          linkId: link.id,
        })),
      });
    }

    // Handle device rules
    if (deviceRules && Array.isArray(deviceRules)) {
      await prisma.deviceRule.createMany({
        data: deviceRules.map((rule) => ({
          redirectUrl: rule.redirectUrl,
          deviceType: rule.deviceType,
          devices: JSON.stringify(rule.devices),
          linkId: link.id,
        })),
      });
    }

    // Return link with all rules
    const linkWithRules = await prisma.link.findUnique({
      where: { id: link.id },
      include: {
        rules: true,
        deviceRules: true,
      },
    });

    return res.json({
      message: "Link created successfully",
      data: linkWithRules,
    });
  } catch (error: unknown) {
    console.error("Error creating link:", error);
    return res.status(500).json({ error: "Failed to create link" });
  }
};

// Get link by ID
export const getLinkById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";

    const link = await prisma.link.findFirst({
      where: {
        id: parseInt(id),
        project: {
          ...(isAdmin ? {} : { userId: userId }),
        },
      },
      include: {
        rules: true,
        deviceRules: true,
      },
    });

    if (!link) {
      return res
        .status(404)
        .json({ message: "Lien non trouvé ou accès non autorisé" });
    }

    return res.json({ message: "Link retrieved successfully", data: link });
  } catch (error: unknown) {
    return res.status(500).json({ message: "Error retrieving link", error });
  }
};

// Update link
export const updateLink = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      baseUrl,
      active,
      rules,
      deviceRules,
      isPasswordProtected,
      password,
      removePassword,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
    } = req.body;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";

    const link = await prisma.link.findFirst({
      where: {
        id: parseInt(id),
        project: {
          ...(isAdmin ? {} : { userId: userId }),
        },
      },
    });

    if (!link) {
      return res.status(404).json({
        error: "Link not found or unauthorized access",
      });
    }

    // Clear redirection cache for this link
    await deleteFromCache(`link:${link.shortCode}`);

    // Handle password updates
    let passwordUpdate = {};
    if (typeof isPasswordProtected !== "undefined") {
      if (isPasswordProtected === true) {
        // Password protection is being enabled or updated
        if (!password && !link.passwordHash) {
          return res.status(400).json({
            error: "Password is required when enabling password protection",
          });
        }
        if (password && password.length < 6) {
          return res.status(400).json({
            error: "Password must be at least 6 characters long",
          });
        }
        if (password) {
          const bcrypt = require("bcrypt");
          const passwordHash = await bcrypt.hash(password, 10);
          passwordUpdate = {
            isPasswordProtected: true,
            passwordHash,
          };
        } else {
          // Keep existing password
          passwordUpdate = {
            isPasswordProtected: true,
          };
        }
      } else {
        // Password protection is being disabled
        passwordUpdate = {
          isPasswordProtected: false,
          passwordHash: null,
        };
      }
    } else if (removePassword) {
      // Explicit password removal
      passwordUpdate = {
        isPasswordProtected: false,
        passwordHash: null,
      };
    }

    // Update link basic information including UTM parameters
    const updatedLink = await prisma.link.update({
      where: { id: parseInt(id) },
      data: {
        name,
        baseUrl,
        active,
        ...passwordUpdate,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
      },
    });

    // Update geo rules
    if (Array.isArray(rules)) {
      await prisma.linkRule.deleteMany({
        where: { linkId: parseInt(id) },
      });

      if (rules.length > 0) {
        await prisma.linkRule.createMany({
          data: rules.map((rule) => ({
            redirectUrl: rule.redirectUrl,
            countries: Array.isArray(rule.countries)
              ? JSON.stringify(rule.countries)
              : rule.countries,
            linkId: parseInt(id),
          })),
        });
      }
    }

    // Update device rules
    if (Array.isArray(deviceRules)) {
      await prisma.deviceRule.deleteMany({
        where: { linkId: parseInt(id) },
      });

      if (deviceRules.length > 0) {
        await prisma.deviceRule.createMany({
          data: deviceRules.map((rule) => ({
            redirectUrl: rule.redirectUrl,
            deviceType: rule.deviceType,
            devices: Array.isArray(rule.devices)
              ? JSON.stringify(rule.devices)
              : "[]",
            linkId: parseInt(id),
          })),
        });
      }
    }

    // Get updated link with all rules
    const linkWithRules = await prisma.link.findUnique({
      where: { id: parseInt(id) },
      include: {
        rules: true,
        deviceRules: true,
      },
    });

    return res.json({
      message: "Link updated successfully",
      data: linkWithRules,
    });
  } catch (error: unknown) {
    console.error("Error updating link:", error);
    return res.status(500).json({ message: "Error updating link", error });
  }
};

// Delete link
export const deleteLink = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";

    const link = await prisma.link.findFirst({
      where: {
        id: parseInt(id),
        project: {
          ...(isAdmin ? {} : { userId: userId }),
        },
      },
    });

    if (!link) {
      return res
        .status(404)
        .json({ message: "Lien non trouvé ou accès non autorisé" });
    }

    // Clear redirection cache before deleting
    await deleteFromCache(`link:${link.shortCode}`);

    await prisma.linkRule.deleteMany({
      where: { linkId: parseInt(id) },
    });

    await prisma.link.delete({
      where: { id: parseInt(id) },
    });

    return res.json({ message: "Link deleted successfully" });
  } catch (error: unknown) {
    return res.status(500).json({ message: "Error deleting link", error });
  }
};

// Add rule to link
export const addRule = async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    const { redirectUrl, countries } = req.body;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";

    const link = await prisma.link.findFirst({
      where: {
        id: parseInt(linkId),
        project: {
          ...(isAdmin ? {} : { userId: userId }),
        },
      },
    });

    if (!link) {
      return res
        .status(404)
        .json({ message: "Lien non trouvé ou accès non autorisé" });
    }

    const rule = await prisma.linkRule.create({
      data: {
        redirectUrl,
        countries: JSON.stringify(countries),
        linkId: parseInt(linkId),
      },
    });

    return res
      .status(201)
      .json({ message: "Rule added successfully", data: rule });
  } catch (error: unknown) {
    return res.status(500).json({ message: "Error adding rule", error });
  }
};

// Update rule
export const updateRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const { redirectUrl, countries } = req.body;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";

    const rule = await prisma.linkRule.findFirst({
      where: {
        id: parseInt(ruleId),
        link: {
          project: {
            ...(isAdmin ? {} : { userId: userId }),
          },
        },
      },
    });

    if (!rule) {
      return res
        .status(404)
        .json({ message: "Règle non trouvée ou accès non autorisé" });
    }

    const updatedRule = await prisma.linkRule.update({
      where: { id: parseInt(ruleId) },
      data: {
        redirectUrl,
        countries: JSON.stringify(countries),
      },
    });

    return res.json({
      message: "Rule updated successfully",
      data: updatedRule,
    });
  } catch (error: unknown) {
    return res.status(500).json({ message: "Error updating rule", error });
  }
};

// Delete rule
export const deleteRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";

    const rule = await prisma.linkRule.findFirst({
      where: {
        id: parseInt(ruleId),
        link: {
          project: {
            ...(isAdmin ? {} : { userId: userId }),
          },
        },
      },
    });

    if (!rule) {
      return res
        .status(404)
        .json({ message: "Règle non trouvée ou accès non autorisé" });
    }

    await prisma.linkRule.delete({
      where: { id: parseInt(ruleId) },
    });

    return res.json({ message: "Rule deleted successfully" });
  } catch (error: unknown) {
    return res.status(500).json({ message: "Error deleting rule", error });
  }
};

interface CachedLink {
  data: any;
  timestamp: number;
}

async function getCachedLinkData(shortCode: string): Promise<any | null> {
  const linkCacheKey = `link:${shortCode}`;
  const cached = await getFromCache(linkCacheKey);

  if (!cached) return null;

  const parsedCache: CachedLink = JSON.parse(cached);
  const now = Date.now();

  // Check if cache is still valid (10 minutes)
  if (now - parsedCache.timestamp <= 10 * 60 * 1000) {
    // Update timestamp for rolling cache
    await saveToCache(
      linkCacheKey,
      JSON.stringify({ ...parsedCache, timestamp: now }),
      600
    );
    return parsedCache.data;
  }

  return null;
}

async function cacheLinkData(shortCode: string, data: any): Promise<void> {
  const linkCacheKey = `link:${shortCode}`;
  const cacheData: CachedLink = {
    data,
    timestamp: Date.now(),
  };
  await saveToCache(linkCacheKey, JSON.stringify(cacheData), 600);
}

// Export the handleRedirection function from the service
export { handleRedirection } from "../services/redirection";

// Get link statistics
export const getLinkStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";
    const timeRange = (req.query.timeRange as string) || "week";
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : null;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : null;
    const countries = req.query.countries
      ? (req.query.countries as string).split(",")
      : null;

    // Vérifier l'accès au lien
    const link = await prisma.link.findFirst({
      where: {
        id: parseInt(id),
        project: {
          ...(isAdmin ? {} : { userId }),
        },
      },
    });

    if (!link) {
      return res
        .status(404)
        .json({ message: "Lien non trouvé ou accès non autorisé" });
    }

    // Construire la clause where pour les visites
    const whereClause: any = { linkId: parseInt(id) };

    // Filtrer par plage de dates
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    } else {
      // Définir une plage par défaut basée sur timeRange
      const now = new Date();
      whereClause.createdAt = { gte: new Date() };

      switch (timeRange) {
        case "day":
          whereClause.createdAt.gte = new Date(now.setDate(now.getDate() - 1));
          break;
        case "week":
          whereClause.createdAt.gte = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          whereClause.createdAt.gte = new Date(
            now.setMonth(now.getMonth() - 1)
          );
          break;
        case "year":
          whereClause.createdAt.gte = new Date(
            now.setFullYear(now.getFullYear() - 1)
          );
          break;
      }
    }

    // Filtrer par pays
    if (countries && countries.length > 0) {
      whereClause.country = { in: countries };
    }

    // Compter le nombre total de visites
    const totalVisits = await prisma.linkVisit.count({
      where: whereClause,
    });

    // Obtenir la répartition par pays
    const visitsByCountry = await prisma.linkVisit.groupBy({
      by: ["country"],
      _count: {
        id: true,
      },
      where: whereClause,
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    // Obtenir la répartition par règle
    const visitsByRule = await prisma.linkVisit.groupBy({
      by: ["ruleId"],
      _count: {
        id: true,
      },
      where: whereClause,
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    // Récupérer les détails des règles
    const rules = await prisma.linkRule.findMany({
      where: { linkId: parseInt(id) },
    });

    // Fusionner les statistiques avec les détails des règles
    const ruleStats = visitsByRule.map(
      (stat: { ruleId: number | null; _count: { id: number } }) => {
        const ruleDetails = stat.ruleId
          ? rules.find((r: { id: number }) => r.id === stat.ruleId)
          : null;
        return {
          ruleId: stat.ruleId || 0,
          count: stat._count.id,
          details: ruleDetails || null,
        };
      }
    );

    // Obtenir les données de séries temporelles
    const timeSeriesQuery = `
      SELECT
        DATE_FORMAT(createdAt, '${
          timeRange === "day"
            ? "%Y-%m-%d %H:00:00"
            : timeRange === "week"
              ? "%Y-%m-%d"
              : timeRange === "month"
                ? "%Y-%m-%d"
                : "%Y-%m"
        }') as date,
        COUNT(*) as count
      FROM LinkVisit
      WHERE linkId = ${parseInt(id)}
        ${
          whereClause.createdAt?.gte
            ? `AND createdAt >= '${whereClause.createdAt.gte.toISOString()}'`
            : ""
        }
        ${
          whereClause.createdAt?.lte
            ? `AND createdAt <= '${whereClause.createdAt.lte.toISOString()}'`
            : ""
        }
        ${
          whereClause.country?.in
            ? `AND country IN (${whereClause.country.in
                .map((c: string) => `'${c}'`)
                .join(",")})`
            : ""
        }
      GROUP BY date
      ORDER BY date ASC
    `;

    const timeSeries = await prisma.$queryRawUnsafe(timeSeriesQuery);

    return res.json({
      message: "Statistiques du lien récupérées avec succès",
      data: {
        link,
        totalVisits,
        visitsByCountry: visitsByCountry.map(
          (item: { country: string; _count: { id: number } }) => ({
            country: item.country,
            count: item._count.id,
          })
        ),
        visitsByRule: ruleStats,
        timeSeries,
      },
    });
  } catch (error: unknown) {
    console.error("Error retrieving link statistics:", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération des statistiques du lien",
      error,
    });
  }
};
