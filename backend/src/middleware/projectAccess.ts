import { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma";
import { buildLocalizedResponse, createTranslator } from "../lib/i18n";

export const validateProjectAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const isAdmin = role === "ADMIN";
    const projectIdentifier =
      req.currentProjectId ||
      req.params.projectId ||
      req.params.id ||
      req.query.projectId ||
      req.headers["x-project-id"] ||
      req.headers["X-Project-ID"];

    const projectId = projectIdentifier
      ? parseInt(projectIdentifier as string, 10)
      : undefined;

    if (!projectId) {
      return next();
    }

    if (!userId) {
      return res
        .status(401)
        .json(
          buildLocalizedResponse(translator, "common.errors.authentication_required")
        );
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        members: {
          where: { userId },
          select: { id: true, role: true, userId: true },
        },
      },
    });

    if (!project) {
      return res
        .status(403)
        .json(
          buildLocalizedResponse(
            translator,
            "project.errors.not_found_or_denied"
          )
        );
    }

    translator = createTranslator({
      req,
      userLocale: req.user?.locale,
      projectLocale: project.locale,
    });

    const isOwner = project.userId === userId;
    const membership = project.members[0];

    if (!isAdmin && !isOwner && !membership) {
      return res
        .status(403)
        .json(
          buildLocalizedResponse(
            translator,
            "project.errors.not_found_or_denied"
          )
        );
    }

    // Add validated project to request
    req.validatedProjectId = project.id;
    req.projectAccess = {
      role: isAdmin ? "ADMIN" : isOwner ? "OWNER" : membership?.role ?? "MEMBER",
      isOwner,
      isAdmin,
      membershipId: membership?.id,
    };
    next();
  } catch (error) {
    console.error("Project access validation error:", error);
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "common.errors.unexpected", {
          error,
        })
      );
  }
};
