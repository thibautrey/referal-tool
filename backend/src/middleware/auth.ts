import { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

// Étendre l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

// Middleware pour vérifier le JWT
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"] as string | undefined;

  if (apiKey) {
    try {
      const keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { user: true },
      });

      if (keyRecord && keyRecord.user) {
        req.user = {
          id: keyRecord.userId,
          email: keyRecord.user.email,
          role: keyRecord.user.role,
        };
        next();
        return;
      }

      return res.status(401).json({
        message: "Accès non autorisé. API key invalide",
      });
    } catch (error) {
      return res.status(500).json({ message: "Erreur serveur" });
    }
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      message: "Accès non autorisé. Token manquant",
    });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || "votre_clé_secrète_par_défaut";

  try {
    const decoded = jwt.verify(token, secret) as {
      id: number;
      email: string;
      role: string;
    };
    req.user = decoded;
    next();
    return;
  } catch (error) {
    return res.status(403).json({
      message: "Token invalide ou expiré",
    });
  }
};

// Middleware pour vérifier si l'utilisateur est admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "ADMIN") {
    next();
    return;
  } else {
    return res.status(403).json({
      message: "Accès non autorisé. Droits d'administrateur requis",
    });
  }
};
