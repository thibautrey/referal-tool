import { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken";

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
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
