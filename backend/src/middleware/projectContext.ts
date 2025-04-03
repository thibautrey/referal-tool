import { NextFunction, Request, Response } from "express";

export const extractProjectContext = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const currentProjectId = req.headers["x-default-project"];

  if (currentProjectId) {
    // Convertir en string si c'est un tableau
    const projectIdStr = Array.isArray(currentProjectId)
      ? currentProjectId[0]
      : currentProjectId;

    // Vérifier que c'est un nombre valide
    const projectIdNum = parseInt(projectIdStr);
    if (!isNaN(projectIdNum)) {
      req.currentProjectId = projectIdStr;
    }
  }

  next();
};
