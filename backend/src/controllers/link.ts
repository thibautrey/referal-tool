import { Request, Response } from "express";

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
  } catch (error) {
    console.error("Error checking short code availability:", error);
    return res
      .status(500)
      .json({ error: "Failed to check short code availability" });
  }
};

// Get all links for a project
export const getLinksByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        userId: userId,
      },
    });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Projet non trouvé ou accès non autorisé" });
    }

    // Get total count
    const total = await prisma.link.count({
      where: {
        projectId: parseInt(projectId),
      },
    });

    const totalPages = Math.ceil(total / limit);

    // Get paginated links with sorting
    const links = await prisma.link.findMany({
      where: {
        projectId: parseInt(projectId),
      },
      include: {
        rules: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    res.json({
      message: "Links retrieved successfully",
      data: {
        links,
        page,
        totalPages,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving links", error });
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ message: "Error deleting rule", error });
  }
};

// Handle link redirection
export const handleRedirection = async (req: Request, res: Response) => {
  try {
    const path = req.params.path;
    const ip = req.ip || "0.0.0.0";

    const [userCountry, userCity] = await getCountryFromIp(ip);

    const link = await prisma.link.findFirst({
      where: {
        name: path,
        active: true,
      },
      include: {
        rules: true,
      },
    });

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    // Find matching rule for user's country
    const matchingRule = link.rules.find((rule) => {
      const countries = JSON.parse(rule.countries);
      return countries.includes(userCountry);
    });

    const redirectUrl = matchingRule ? matchingRule.redirectUrl : link.baseUrl;

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
  } catch (error) {
    console.error("Redirection error:", error);
    res.status(500).json({ message: "Error handling redirection" });
  }
};
