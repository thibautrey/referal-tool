import { Request, Response } from "express";

import prisma from "../lib/prisma";

// Get all links for a project
export const getLinksByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

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

    // Get paginated links
    const links = await prisma.link.findMany({
      where: {
        projectId: parseInt(projectId),
      },
      include: {
        rules: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      message: "Links retrieved successfully",
      data: {
        links,
        page,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving links", error });
  }
};

// Create new link
export const createLink = async (req: Request, res: Response) => {
  try {
    const projectId = req.headers["x-project-id"] as string;
    const { name, baseUrl, rules } = req.body;
    const userId = req.user?.id;
    const targetProjectId =
      projectId === "undefined" ? req.currentProjectId : projectId;

    // Validation des données requises
    if (!name || !baseUrl) {
      return res.status(400).json({
        message: "Le nom et l'URL de base sont requis",
      });
    }

    if (!targetProjectId) {
      return res.status(400).json({
        message:
          "Project ID is required. Either provide it in the URL or set a default project.",
      });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(targetProjectId),
        userId: userId,
      },
    });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Projet non trouvé ou accès non autorisé" });
    }

    // Validate and format rules if they exist
    interface FormattedRule {
      redirectUrl: string;
      countries: string;
    }
    let formattedRules: FormattedRule[] = [];
    if (rules && Array.isArray(rules)) {
      formattedRules = rules.map((rule) => ({
        redirectUrl: rule.redirectUrl,
        countries: Array.isArray(rule.countries)
          ? JSON.stringify(rule.countries)
          : "[]",
      }));
    }

    const link = await prisma.link.create({
      data: {
        name,
        baseUrl,
        projectId: parseInt(targetProjectId),
        rules: {
          create: formattedRules,
        },
      },
      include: {
        rules: true,
      },
    });

    res.status(201).json({ message: "Link created successfully", data: link });
  } catch (error) {
    console.error("Link creation error:", error);
    res.status(500).json({
      message: "Error creating link",
      error: error instanceof Error ? error.message : "Unknown error",
    });
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
