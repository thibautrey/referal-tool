import { ApiResponse, ControllerFunction } from "../types";
import { Request, Response } from "express";

import bcrypt from "bcrypt";
import prisma from "../lib/prisma";

/**
 * Récupérer tous les utilisateurs
 */
export const getUsers: ControllerFunction = async (
  _req: Request,
  res: Response
) => {
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

    const response: ApiResponse = {
      message: "Utilisateurs récupérés avec succès",
      data: users,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs",
      error,
    });
  }
};

/**
 * Créer un nouvel utilisateur
 */
export const createUser: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, firstName, lastName, password, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({
        message: "Un utilisateur avec cet email existe déjà",
      });
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
      },
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

    const response: ApiResponse = {
      message: "Utilisateur créé avec succès",
      data: newUser,
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la création de l'utilisateur",
      error,
    });
  }
};

/**
 * Récupérer un utilisateur par son ID
 */
export const getUserById: ControllerFunction = async (
  req: Request,
  res: Response
) => {
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "Utilisateur non trouvé",
      });
      return;
    }

    const response: ApiResponse = {
      message: "Utilisateur récupéré avec succès",
      data: user,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération de l'utilisateur",
      error,
    });
  }
};

/**
 * Mettre à jour un utilisateur
 */
export const updateUser: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    const { email, firstName, lastName, active, role, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        message: "Utilisateur non trouvé",
      });
      return;
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      email,
      firstName,
      lastName,
      active,
      role,
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
        createdAt: true,
        updatedAt: true,
      },
    });

    const response: ApiResponse = {
      message: "Utilisateur mis à jour avec succès",
      data: updatedUser,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la mise à jour de l'utilisateur",
      error,
    });
  }
};

/**
 * Supprimer un utilisateur
 */
export const deleteUser: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        message: "Utilisateur non trouvé",
      });
      return;
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    const response: ApiResponse = {
      message: "Utilisateur supprimé avec succès",
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la suppression de l'utilisateur",
      error,
    });
  }
};

/**
 * Récupérer l'utilisateur actuellement connecté
 */
export const getCurrentUser = async (req: any, res: any) => {
  try {
    // L'utilisateur est déjà disponible dans req.user grâce au middleware authenticateJWT
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur non trouvé",
      });
    }

    // Retourner les informations de l'utilisateur sans le mot de passe
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;

    return res.status(200).json({
      message: "Utilisateur récupéré avec succès",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération de l'utilisateur",
    });
  }
};
