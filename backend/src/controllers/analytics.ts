import { Link, LinkRule, LinkVisit } from "@prisma/client";
import { Request, Response } from "express";
import { getFromCache, saveToCache } from "../lib/redis";

import prisma from "../lib/prisma";

// Obtenir les statistiques de visites pour un lien ou un projet spécifique
export const getVisitStats = async (req: Request, res: Response) => {
  const projectId = req.currentProjectId;
  const cacheKey = `visits:${projectId}`;

  // Try to get from cache first
  const cachedStats = await getFromCache(cacheKey);
  if (cachedStats) {
    return res.json(cachedStats);
  }

  try {
    const userId = req.user?.id;
    const { linkId } = req.query;
    const timeRange = (req.query.timeRange as string) || "week"; // day, week, month, year
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : null;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : null;
    const countries = req.query.countries
      ? (req.query.countries as string).split(",")
      : null;

    // Valider que l'utilisateur a accès au projet spécifié
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: parseInt(projectId as string),
          userId,
        },
      });

      if (!project) {
        return res
          .status(404)
          .json({ message: "Projet non trouvé ou accès non autorisé" });
      }
    }

    // Construire la condition where pour Prisma
    const whereClause: any = {};

    // Filtrer par projet ou lien spécifique
    if (linkId) {
      whereClause.linkId = parseInt(linkId as string);
    } else if (projectId) {
      whereClause.link = { projectId: parseInt(projectId as string) };
    } else {
      // Si ni projectId ni linkId n'est fourni, récupérer tous les liens de l'utilisateur
      whereClause.link = { project: { userId } };
    }

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

    // Répartition par pays
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

    // Calculer la répartition par date
    const visitsByDate = await getVisitsByTimeInterval(
      projectId ? parseInt(projectId as string) : null,
      linkId ? parseInt(linkId as string) : null,
      timeRange
    );

    // Si linkId est spécifié, ajouter les statistiques par règles
    let visitsByRule = null;
    if (linkId) {
      const rawVisitsByRule = await prisma.linkVisit.groupBy({
        by: ["ruleId"],
        _count: {
          id: true,
        },
        where: whereClause,
      });

      // Récupérer les détails des règles pour les afficher
      const rulesInfo: Pick<LinkRule, "id" | "redirectUrl" | "countries">[] =
        await prisma.linkRule.findMany({
          where: {
            linkId: parseInt(linkId as string),
          },
          select: {
            id: true,
            redirectUrl: true,
            countries: true,
          },
        });

      // Associer les informations des règles avec les statistiques
      visitsByRule = rawVisitsByRule.map((ruleStats) => {
        const ruleInfo =
          rulesInfo.find((r) => r.id === ruleStats.ruleId) || null;
        return {
          ruleId: ruleStats.ruleId,
          count: ruleStats._count.id,
          ruleInfo,
        };
      });
    }

    const stats = {
      message: "Statistiques récupérées avec succès",
      data: {
        totalVisits,
        visitsByCountry: visitsByCountry.map((item) => ({
          country: item.country,
          count: item._count.id,
        })),
        visitsByDate,
        visitsByRule,
      },
    };

    // Cache the results for 5 minutes (300 seconds)
    await saveToCache(cacheKey, stats, 300);

    return res.json(stats);
  } catch (error) {
    console.error("Error retrieving analytics:", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération des statistiques",
      error,
    });
  }
};

// Obtenir les statistiques de visites en fonction de l'intervalle de temps
async function getVisitsByTimeInterval(
  projectId: number | null = null,
  linkId: number | null = null,
  timeRange: string = "week"
): Promise<Array<{ date: string; count: number }>> {
  try {
    // Construire la clause where pour filtrer les visites
    const whereClause: any = {};

    if (linkId) {
      whereClause.linkId = linkId;
    } else if (projectId) {
      whereClause.link = { projectId };
    }

    // Déterminer la plage de dates à analyser
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "day":
        startDate.setDate(startDate.getDate() - 1);
        break;
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7); // Par défaut 1 semaine
    }

    whereClause.createdAt = {
      gte: startDate,
      lte: endDate,
    };

    // Récupérer toutes les visites pour la période
    const visits: Pick<LinkVisit, "createdAt">[] =
      await prisma.linkVisit.findMany({
        where: whereClause,
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    // Préparer la structure de données pour l'agrégation
    const visitsByDate = new Map<string, number>();

    // Formater et agréger les dates selon le timeRange
    visits.forEach((visit) => {
      const date = formatDateByTimeRange(visit.createdAt, timeRange);
      visitsByDate.set(date, (visitsByDate.get(date) || 0) + 1);
    });

    // Convertir en tableau pour le retour
    const result = Array.from(visitsByDate.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return result;
  } catch (error) {
    console.error("Error in time series query:", error);
    return [];
  }
}

// Fonction utilitaire pour formater les dates selon l'intervalle
function formatDateByTimeRange(date: Date, timeRange: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");

  switch (timeRange) {
    case "day":
      return `${year}-${month}-${day} ${hours}:00`;
    case "week":
    case "month":
      return `${year}-${month}-${day}`;
    case "year":
      return `${year}-${month}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

// Obtenir des statistiques agrégées pour le tableau de bord
export const getDashboardStats = async (req: Request, res: Response) => {
  const projectId = req.currentProjectId;
  const cacheKey = `dashboard:${projectId}`;

  const cachedStats = await getFromCache(cacheKey);
  if (cachedStats) {
    return res.json(cachedStats);
  }

  try {
    const userId = req.user?.id;

    // Vérifier l'accès au projet
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: Number(projectId),
          userId,
        },
      });

      if (!project) {
        return res
          .status(404)
          .json({ message: "Projet non trouvé ou accès non autorisé" });
      }
    }

    // Construire la clause where commune
    const baseWhereClause = projectId
      ? { link: { projectId: Number(projectId) } }
      : { link: { project: { userId } } };

    // Obtenir le nombre total de liens
    const totalLinks = await prisma.link.count({
      where: projectId
        ? { projectId: Number(projectId) }
        : { project: { userId } },
    });

    // Obtenir le nombre total de visites
    const totalVisits = await prisma.linkVisit.count({
      where: baseWhereClause,
    });

    // Obtenir les visites des dernières 24 heures
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    const last24HoursVisits = await prisma.linkVisit.count({
      where: {
        ...baseWhereClause,
        createdAt: { gte: last24Hours },
      },
    });

    // Obtenir les 5 pays les plus visités
    const topCountries = await prisma.linkVisit.groupBy({
      by: ["country"],
      _count: {
        id: true,
      },
      where: baseWhereClause,
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    // Obtenir les 5 liens les plus visités
    const topLinks = await prisma.linkVisit.groupBy({
      by: ["linkId"],
      _count: {
        id: true,
      },
      where: baseWhereClause,
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    // Récupérer les informations détaillées sur les liens les plus visités
    const linkDetails: Pick<Link, "id" | "name" | "shortCode" | "baseUrl">[] =
      await prisma.link.findMany({
        where: {
          id: { in: topLinks.map((l) => l.linkId) },
        },
        select: {
          id: true,
          name: true,
          shortCode: true,
          baseUrl: true,
        },
      });

    // Associer les détails des liens avec leurs statistiques
    const topLinksWithDetails = topLinks.map((linkStat) => {
      const details = linkDetails.find((l) => l.id === linkStat.linkId);
      return {
        linkId: linkStat.linkId,
        visits: linkStat._count.id,
        details,
      };
    });

    const stats = {
      message: "Statistiques du tableau de bord récupérées avec succès",
      data: {
        totalLinks,
        totalVisits,
        last24HoursVisits,
        topCountries: topCountries.map((c) => ({
          country: c.country,
          visits: c._count.id,
        })),
        topLinks: topLinksWithDetails,
      },
    };

    // Cache dashboard stats for 5 minutes
    await saveToCache(cacheKey, stats, 300);

    return res.json(stats);
  } catch (error) {
    console.error("Error retrieving dashboard stats:", error);
    return res.status(500).json({
      message:
        "Erreur lors de la récupération des statistiques du tableau de bord",
      error,
    });
  }
};
