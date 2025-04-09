import { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma";

export const validateProjectAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const projectId =
      req.currentProjectId || req.params.projectId || req.query.projectId;

    if (!projectId) {
      return next();
    }

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId as string),
        userId: userId,
      },
    });

    if (!project) {
      return res
        .status(403)
        .json({ message: "Project not found or access denied" });
    }

    // Add validated project to request
    req.validatedProjectId = project.id;
    next();
  } catch (error) {
    console.error("Project access validation error:", error);
    res.status(500).json({ message: "Error validating project access" });
  }
};
