import { ControllerFunction } from "../types";
import { Request, Response } from "express";

import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { buildLocalizedResponse, createTranslator } from "../lib/i18n";

/**
 * Récupérer tous les utilisateurs
 */
export const getUsers: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  const translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(
      buildLocalizedResponse(translator, "user.list.success", { data: users })
    );
  } catch (error) {
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "user.list.error", { error })
      );
  }
};

/**
 * Créer un nouvel utilisateur
 */
export const createUser: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  const translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    const { email, firstName, lastName, password, role, locale } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res
        .status(400)
        .json(buildLocalizedResponse(translator, "user.create.exists"));
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: role || undefined,
        locale: locale ?? translator.locale,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res
      .status(201)
      .json(
        buildLocalizedResponse(translator, "user.create.success", {
          data: newUser,
        })
      );
  } catch (error) {
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "user.create.error", { error })
      );
  }
};

/**
 * Récupérer un utilisateur par son ID
 */
export const getUserById: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  let translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res
        .status(404)
        .json(buildLocalizedResponse(translator, "common.errors.user_not_found"));
      return;
    }

    translator = createTranslator({ req, userLocale: user.locale ?? translator.locale });

    res.json(
      buildLocalizedResponse(translator, "user.get.success", { data: user })
    );
  } catch (error) {
    res
      .status(500)
      .json(buildLocalizedResponse(translator, "user.get.error", { error }));
  }
};

/**
 * Mettre à jour un utilisateur
 */
export const updateUser: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  let translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    const { email, firstName, lastName, active, role, password, locale } =
      req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        locale: true,
      },
    });

    if (!user) {
      res
        .status(404)
        .json(buildLocalizedResponse(translator, "common.errors.user_not_found"));
      return;
    }

    translator = createTranslator({ req, userLocale: user.locale ?? translator.locale });

    // Préparer les données de mise à jour
    const updateData: any = {
      email,
      firstName,
      lastName,
      active,
      role,
      locale,
    };

    // Si un nouveau mot de passe est fourni, le hacher
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(
      buildLocalizedResponse(translator, "user.update.success", {
        data: updatedUser,
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "user.update.error", { error })
      );
  }
};

/**
 * Supprimer un utilisateur
 */
export const deleteUser: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  let translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true },
    });

    if (!user) {
      res
        .status(404)
        .json(buildLocalizedResponse(translator, "common.errors.user_not_found"));
      return;
    }

    translator = createTranslator({ req, userLocale: user.locale ?? translator.locale });

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json(buildLocalizedResponse(translator, "user.delete.success"));
  } catch (error) {
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "user.delete.error", { error })
      );
  }
};

/**
 * Récupérer l'utilisateur actuellement connecté
 */
export const getCurrentUser = async (req: any, res: any) => {
  const translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    // L'utilisateur est déjà disponible dans req.user grâce au middleware authenticateJWT
    const user = req.user;

    if (!user) {
      return res
        .status(404)
        .json(buildLocalizedResponse(translator, "common.errors.user_not_found"));
    }

    // Retourner les informations de l'utilisateur sans le mot de passe
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;

    return res
      .status(200)
      .json(
        buildLocalizedResponse(translator, "user.get.success", {
          data: userWithoutPassword,
        })
      );
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return res
      .status(500)
      .json(buildLocalizedResponse(translator, "user.get.error", { error }));
  }
};

/**
 * Marquer un conseil comme vu
 */
export const markTipAsSeen = async (req: Request, res: Response) => {
  const translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    const userId = req.user?.id;
    const { tipId } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json(buildLocalizedResponse(translator, "common.errors.unauthenticated"));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { seenTips: true },
    });

    const seenTips = user?.seenTips ? JSON.parse(user.seenTips) : [];
    if (!seenTips.includes(tipId)) {
      seenTips.push(tipId);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { seenTips: JSON.stringify(seenTips) },
    });

    res.json(
      buildLocalizedResponse(translator, "user.tips.marked", {
        data: { seenTips },
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(buildLocalizedResponse(translator, "user.tips.error", { error }));
  }
};

/**
 * Update user's theme preference
 */
export const updateTheme = async (req: Request, res: Response) => {
  const translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    const userId = req.user?.id;
    const { theme } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json(buildLocalizedResponse(translator, "common.errors.unauthenticated"));
    }

    if (!theme || !["light", "dark", "system"].includes(theme)) {
      return res
        .status(400)
        .json(buildLocalizedResponse(translator, "user.theme.invalid_value"));
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { theme },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        theme: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(
      buildLocalizedResponse(translator, "user.theme.success", {
        data: updatedUser,
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(buildLocalizedResponse(translator, "user.theme.error", { error }));
  }
};

/**
 * Update user's last selected project
 */
export const updateLastProjectId = async (req: Request, res: Response) => {
  let translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";
    const { projectId } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json(buildLocalizedResponse(translator, "common.errors.unauthenticated"));
    }

    if (!projectId || typeof projectId !== "number") {
      return res
        .status(400)
        .json(buildLocalizedResponse(translator, "user.last_project.invalid_id"));
    }

    // Verify that the project exists and belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...(isAdmin ? {} : { userId: userId }),
      },
      select: { locale: true },
    });

    if (!project) {
      return res
        .status(404)
        .json(
          buildLocalizedResponse(
            translator,
            "project.errors.not_found_or_denied"
          )
        );
    }

    translator = createTranslator({ req, userLocale: req.user?.locale, projectLocale: project.locale });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { lastProjectId: projectId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        lastProjectId: true,
        theme: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(
      buildLocalizedResponse(translator, "user.last_project.success", {
        data: updatedUser,
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "user.last_project.error", {
          error,
        })
      );
  }
};
