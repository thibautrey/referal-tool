import { Request, Response } from "express";
import { getFromCache, saveToCache } from "../lib/redis";

import { getCountryFromIp } from "../utils/geolocation";
import prisma from "../lib/prisma";

// Fonction pour générer un code court aléatoire
const generateRandomCode = (length: number = 4): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Vérifier si un code court est disponible
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

    // Ajouter des logs pour débogage
    console.log(`Checking short code: ${code}, exists: ${!!existingLink}`);

    // Si existingLink est null, le code est disponible
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
        userId: userId,
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
    res.json(response);
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

    res.status(500).json({ message: "Error retrieving links" });
  }
};

// Créer un nouveau lien avec un code court
export const createLink = async (req: Request, res: Response) => {
  try {
    const { name, baseUrl, shortCode, rules } = req.body;
    const projectId = parseInt(
      req.params.projectId || (req.headers["x-project-id"] as string)
    );

    // Valider les entrées
    if (!name || !baseUrl) {
      return res.status(400).json({ error: "Name and base URL are required" });
    }

    // Générer un code court si non fourni
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
      // Vérifier si le code court existe déjà
      const existingLink = await prisma.link.findUnique({
        where: { shortCode: finalShortCode },
      });

      if (existingLink) {
        return res.status(400).json({ error: "Short code already in use" });
      }
    }

    // Créer le lien avec son code court
    const link = await prisma.link.create({
      data: {
        name,
        baseUrl,
        shortCode: finalShortCode,
        projectId,
      },
    });

    // Ajouter les règles si fournies
    if (rules && Array.isArray(rules)) {
      for (const rule of rules) {
        await prisma.linkRule.create({
          data: {
            redirectUrl: rule.redirectUrl,
            countries: JSON.stringify(rule.countries),
            linkId: link.id,
          },
        });
      }
    }

    // Récupérer le lien avec ses règles
    const linkWithRules = await prisma.link.findUnique({
      where: { id: link.id },
      include: { rules: true },
    });

    return res.status(201).json(linkWithRules);
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

    const link = await prisma.link.findFirst({
      where: {
        id: parseInt(id),
        project: {
          userId: userId,
        },
      },
      include: {
        rules: true,
      },
    });

    if (!link) {
      return res
        .status(404)
        .json({ message: "Lien non trouvé ou accès non autorisé" });
    }

    res.json({ message: "Link retrieved successfully", data: link });
  } catch (error: unknown) {
    res.status(500).json({ message: "Error retrieving link", error });
  }
};

// Update link
export const updateLink = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, baseUrl, active } = req.body;
    const userId = req.user?.id;

    const link = await prisma.link.findFirst({
      where: {
        id: parseInt(id),
        project: {
          userId: userId,
        },
      },
    });

    if (!link) {
      return res
        .status(404)
        .json({ message: "Lien non trouvé ou accès non autorisé" });
    }

    const updatedLink = await prisma.link.update({
      where: { id: parseInt(id) },
      data: {
        name,
        baseUrl,
        active,
      },
      include: {
        rules: true,
      },
    });

    res.json({ message: "Link updated successfully", data: updatedLink });
  } catch (error: unknown) {
    res.status(500).json({ message: "Error updating link", error });
  }
};

// Delete link
export const deleteLink = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const link = await prisma.link.findFirst({
      where: {
        id: parseInt(id),
        project: {
          userId: userId,
        },
      },
    });

    if (!link) {
      return res
        .status(404)
        .json({ message: "Lien non trouvé ou accès non autorisé" });
    }

    await prisma.linkRule.deleteMany({
      where: { linkId: parseInt(id) },
    });

    await prisma.link.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Link deleted successfully" });
  } catch (error: unknown) {
    res.status(500).json({ message: "Error deleting link", error });
  }
};

// Add rule to link
export const addRule = async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    const { redirectUrl, countries } = req.body;
    const userId = req.user?.id;

    const link = await prisma.link.findFirst({
      where: {
        id: parseInt(linkId),
        project: {
          userId: userId,
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

    res.status(201).json({ message: "Rule added successfully", data: rule });
  } catch (error: unknown) {
    res.status(500).json({ message: "Error adding rule", error });
  }
};

// Update rule
export const updateRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const { redirectUrl, countries } = req.body;
    const userId = req.user?.id;

    const rule = await prisma.linkRule.findFirst({
      where: {
        id: parseInt(ruleId),
        link: {
          project: {
            userId: userId,
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

    res.json({ message: "Rule updated successfully", data: updatedRule });
  } catch (error: unknown) {
    res.status(500).json({ message: "Error updating rule", error });
  }
};

// Delete rule
export const deleteRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const userId = req.user?.id;

    const rule = await prisma.linkRule.findFirst({
      where: {
        id: parseInt(ruleId),
        link: {
          project: {
            userId: userId,
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

    res.json({ message: "Rule deleted successfully" });
  } catch (error: unknown) {
    res.status(500).json({ message: "Error deleting rule", error });
  }
};

// Handle link redirection
export const handleRedirection = async (req: Request, res: Response) => {
  try {
    const path = req.params.path;
    const ip = req.ip || "0.0.0.0";

    // Check cache for link data first
    const linkCacheKey = `link:${path}`;
    const cachedLink = await getFromCache(linkCacheKey);

    let link;
    if (cachedLink) {
      link = cachedLink;
    } else {
      link = await prisma.link.findFirst({
        where: {
          shortCode: path,
          active: true,
        },
        include: {
          rules: true,
        },
      });

      if (link) {
        // Cache link data for 5 minutes (300 seconds)
        await saveToCache(linkCacheKey, link, 300);
      }
    }

    if (!link) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Link not found</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
                text-align: center;
                color: #333;
                background-color: #f8f9fa;
              }
              .container {
                max-width: 600px;
                padding: 40px;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              }
              h1 {
                font-size: 24px;
                margin-bottom: 20px;
              }
              p {
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 25px;
              }
              .icon {
                font-size: 48px;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">😕</div>
              <h1>Link not found</h1>
              <p>The link you accessed is no longer available.</p>
            </div>
          </body>
        </html>
      `);
    }

    const [userCountry, userCity] = await getCountryFromIp(ip);

    // Find matching rule for user's country
    interface Rule {
      id: number;
      countries: string;
      redirectUrl: string;
    }

    const matchingRule: Rule | undefined = link.rules.find((rule: Rule) => {
      const countries: string[] = JSON.parse(rule.countries);
      return countries.includes(userCountry);
    });

    let redirectUrl = matchingRule ? matchingRule.redirectUrl : link.baseUrl;

    // Vérifier si l'URL commence par http:// ou https://, sinon ajouter https://
    if (!redirectUrl.match(/^https?:\/\//i)) {
      redirectUrl = `https://${redirectUrl}`;
    }

    // Asynchronously record the visit
    prisma.linkVisit
      .create({
        data: {
          linkId: link.id,
          ip,
          country: userCountry,
          city: userCity,
          ruleId: matchingRule?.id || null,
        },
      })
      .catch((error) => {
        console.error("Error recording visit:", error);
      });

    res.redirect(301, redirectUrl);
  } catch (error: unknown) {
    console.error("Redirection error:", error);
    res.status(500).json({ message: "Error handling redirection" });
  }
};

// Obtenir les statistiques d'un lien spécifique
export const getLinkStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
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
          userId,
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

    // Add interfaces for the data structures
    interface RuleStat {
      ruleId: number;
      count: number;
      rule: {
        id: number;
        redirectUrl: string;
        countries: string[];
      } | null;
    }

    interface DateVisit {
      date: string;
      count: number;
    }

    // Fusionner les statistiques avec les détails des règles
    const ruleStats = visitsByRule.map((stat) => {
      const ruleDetails = rules.find((r) => r.id === stat.ruleId);
      return {
        ruleId: stat.ruleId,
        count: stat._count.id,
        details: ruleDetails || null,
      };
    });

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

    res.json({
      message: "Statistiques du lien récupérées avec succès",
      data: {
        link,
        totalVisits,
        visitsByCountry: visitsByCountry.map((item) => ({
          country: item.country,
          count: item._count.id,
        })),
        visitsByRule: ruleStats,
        timeSeries,
      },
    });
  } catch (error: unknown) {
    console.error("Error retrieving link statistics:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des statistiques du lien",
      error,
    });
  }
};
