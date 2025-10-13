import { Request, Response } from "express";
import { ApiResponse } from "../types";
import prisma from "../lib/prisma";
import { randomBytes } from "crypto";

export const listApiKeys = async (req: Request, res: Response) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user!.id },
      select: {
        id: true,
        name: true,
        key: true,
        createdAt: true,
        primaryAiProvider: {
          select: {
            id: true,
            name: true,
          },
        },
        primaryAiModel: {
          select: {
            id: true,
            name: true,
            modelIdentifier: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      message: "Clés API récupérées avec succès",
      data: keys,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des clés API", error });
  }
};

export const createApiKey = async (req: Request, res: Response) => {
  try {
    const { name, primaryAiProviderId, primaryAiModelId } = req.body;
    const key = randomBytes(32).toString("hex");

    if (!name) {
      res.status(400).json({ message: "Le nom de la clé API est requis" });
      return;
    }

    let providerIdToUse = primaryAiProviderId as number | undefined;

    if (primaryAiModelId) {
      const model = await prisma.aiModel.findUnique({
        where: { id: Number(primaryAiModelId) },
        select: {
          id: true,
          providerId: true,
        },
      });

      if (!model) {
        res.status(400).json({ message: "Modèle d'IA introuvable" });
        return;
      }

      if (providerIdToUse && model.providerId !== Number(providerIdToUse)) {
        res.status(400).json({ message: "Le modèle sélectionné n'appartient pas au fournisseur spécifié" });
        return;
      }

      providerIdToUse = model.providerId;
    }

    if (providerIdToUse) {
      const providerExists = await prisma.aiProvider.findUnique({
        where: { id: Number(providerIdToUse) },
        select: { id: true },
      });

      if (!providerExists) {
        res.status(400).json({ message: "Fournisseur d'IA introuvable" });
        return;
      }
    }

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        userId: req.user!.id,
        primaryAiProviderId: providerIdToUse ? Number(providerIdToUse) : undefined,
        primaryAiModelId: primaryAiModelId ? Number(primaryAiModelId) : undefined,
      },
      select: {
        id: true,
        name: true,
        key: true,
        createdAt: true,
        primaryAiProvider: {
          select: {
            id: true,
            name: true,
          },
        },
        primaryAiModel: {
          select: {
            id: true,
            name: true,
            modelIdentifier: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      message: "Clé API créée avec succès",
      data: apiKey,
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de la clé API", error });
  }
};

export const deleteApiKey = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.apiKey.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({ message: "Clé API introuvable" });
      return;
    }

    await prisma.apiKey.delete({ where: { id } });

    const response: ApiResponse = {
      message: "Clé API supprimée avec succès",
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de la clé API", error });
  }
};
