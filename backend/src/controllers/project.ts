import { Request, Response } from "express";
import { buildLocalizedResponse, createTranslator } from "../lib/i18n";

import { ProjectMemberRole } from "@prisma/client";
import { getProjectMemberInvitationTemplate } from "../templates/project-member-invite";
import prisma from "../lib/prisma";
import { sendEmail } from "../utils/email";

const ALLOWED_SORT_FIELDS = [
  "id",
  "name",
  "baseUrl",
  "shortCode",
  "projectId",
  "active",
  "createdAt",
  "updatedAt",
];

const getRequestTranslator = (req: Request, projectLocale?: string | null) =>
  createTranslator({ req, userLocale: req.user?.locale, projectLocale });

export const getProjects = async (req: Request, res: Response) => {
  const translator = getRequestTranslator(req);
  try {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";

    const projects = await prisma.project.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { userId },
              {
                members: {
                  some: {
                    userId,
                  },
                },
              },
            ],
          },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      role: isAdmin
        ? "ADMIN"
        : project.userId === userId
        ? "OWNER"
        : project.members[0]?.role ?? ProjectMemberRole.MEMBER,
    }));

    res.json({ data: formattedProjects });
  } catch (error) {
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "project.errors.fetch_list", {
          error,
        })
      );
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  const translator = getRequestTranslator(req);
  try {
    const projectId = req.validatedProjectId ?? parseInt(req.params.id);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!project) {
      return res
        .status(404)
        .json(buildLocalizedResponse(translator, "project.errors.not_found"));
    }

    res.json({
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        owner: project.user,
        role: req.projectAccess?.role ?? (req.user?.role === "ADMIN" ? "ADMIN" : "MEMBER"),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "project.errors.fetch_single", {
          error,
        })
      );
  }
};

export const getProjectLinks = async (req: Request, res: Response) => {
  let translator = getRequestTranslator(req);
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";
    let {
      page = 1,
      limit = 100,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 100, 1), 500); // Min 1, Max 500, Default 100

    if (!ALLOWED_SORT_FIELDS.includes(sortBy as string)) {
      sortBy = "createdAt";
    }

    const projectId = parseInt(id, 10);
    if (Number.isNaN(projectId)) {
      return res
        .status(400)
        .json(buildLocalizedResponse(translator, "project.errors.id_required"));
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...(isAdmin ? {} : { userId }),
      },
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

    translator = getRequestTranslator(req, project.locale);

    // Build search filter
    const searchQuery = search ? (search as string).trim() : "";
    const whereClause: any = { projectId };

    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery } },
        { baseUrl: { contains: searchQuery } },
        { shortCode: { contains: searchQuery } },
      ];
    }

    const links = await prisma.link.findMany({
      where: whereClause,
      orderBy: { [sortBy as string]: sortOrder },
      take: limitNumber,
      skip: (pageNumber - 1) * limitNumber,
    });

    const total = await prisma.link.count({
      where: whereClause,
    });

    res.json(
      buildLocalizedResponse(translator, "project.success.links_retrieved", {
        data: {
          links,
          total,
          page: pageNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      })
    );
  } catch (error) {
    console.error("Error fetching project links", error);
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "project.errors.fetch_links", {
          error,
        })
      );
  }
};

export const getProjectStats = async (req: Request, res: Response) => {
  const translator = getRequestTranslator(req);
  try {
    const { id } = req.params;
    // Implement project stats logic here
    res.json({ data: {} });
  } catch (error) {
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "project.errors.fetch_stats", {
          error,
        })
      );
  }
};

export const createProject = async (req: Request, res: Response) => {
  const translator = getRequestTranslator(req);
  try {
    const userId = req.user?.id;
    const { name, description, locale } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        locale: locale ?? req.user?.locale ?? translator.locale,
        user: {
          connect: { id: userId },
        },
      },
    });

    res.status(201).json({ data: project });
  } catch (error) {
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "project.errors.create", { error })
      );
  }
};

export const updateProject = async (req: Request, res: Response) => {
  const translator = getRequestTranslator(req);
  try {
    if (!req.projectAccess?.isOwner && !req.projectAccess?.isAdmin) {
      return res
        .status(403)
        .json(
          buildLocalizedResponse(translator, "project.errors.update_forbidden")
        );
    }
    const { id } = req.params;
    const { name, description, locale } = req.body;

    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: { name, description, locale },
    });

    res.json({ data: project });
  } catch (error) {
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "project.errors.update", { error })
      );
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  const translator = getRequestTranslator(req);
  try {
    if (!req.projectAccess?.isOwner && !req.projectAccess?.isAdmin) {
      return res
        .status(403)
        .json(
          buildLocalizedResponse(translator, "project.errors.delete_forbidden")
        );
    }
    const { id } = req.params;

    await prisma.project.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "project.errors.delete", { error })
      );
  }
};

export const getProjectMembers = async (req: Request, res: Response) => {
  let translator = getRequestTranslator(req);
  try {
    const projectId = req.validatedProjectId ?? parseInt(req.params.id, 10);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!project) {
      return res
        .status(404)
        .json(buildLocalizedResponse(translator, "project.errors.not_found"));
    }

    translator = getRequestTranslator(req, project.locale);

    const response = {
      owner: {
        id: project.user.id,
        email: project.user.email,
        firstName: project.user.firstName,
        lastName: project.user.lastName,
      },
      members: project.members.map((member) => ({
        id: member.id,
        role: member.role,
        createdAt: member.createdAt,
        user: {
          id: member.user.id,
          email: member.user.email,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
        },
      })),
    };

    res.json({ data: response });
  } catch (error) {
    console.error("Error fetching project members", error);
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "project.errors.fetch_members", {
          error,
        })
      );
  }
};

export const addProjectMember = async (req: Request, res: Response) => {
  let translator = getRequestTranslator(req);
  try {
    if (!req.projectAccess?.isOwner && !req.projectAccess?.isAdmin) {
      return res
        .status(403)
        .json(
          buildLocalizedResponse(translator, "project.errors.invite_forbidden")
        );
    }

    const projectId = req.validatedProjectId ?? parseInt(req.params.id, 10);
    const { email, role = ProjectMemberRole.MEMBER } = req.body as {
      email?: string;
      role?: ProjectMemberRole;
    };

    if (!projectId || Number.isNaN(projectId)) {
      return res
        .status(400)
        .json(buildLocalizedResponse(translator, "project.errors.id_required"));
    }

    if (!email) {
      return res
        .status(400)
        .json(
          buildLocalizedResponse(translator, "project.errors.invite_email_required")
        );
    }

    const userToInvite = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!userToInvite) {
      return res
        .status(404)
        .json(buildLocalizedResponse(translator, "common.errors.user_not_found"));
    }

    if (userToInvite.id === req.user?.id) {
      return res
        .status(400)
        .json(buildLocalizedResponse(translator, "project.errors.invite_self"));
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { user: true },
    });

    if (!project) {
      return res
        .status(404)
        .json(buildLocalizedResponse(translator, "project.errors.not_found"));
    }

    translator = getRequestTranslator(req, project.locale);

    if (project.userId === userToInvite.id) {
      return res
        .status(400)
        .json(buildLocalizedResponse(translator, "project.errors.invite_owner"));
    }

    const normalizedRole =
      role === ProjectMemberRole.ADMIN
        ? ProjectMemberRole.ADMIN
        : ProjectMemberRole.MEMBER;

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: userToInvite.id,
        },
      },
    });

    if (existingMember) {
      return res
        .status(409)
        .json(
          buildLocalizedResponse(translator, "project.errors.invite_duplicate")
        );
    }

    const newMember = await prisma.projectMember.create({
      data: {
        project: { connect: { id: projectId } },
        user: { connect: { id: userToInvite.id } },
        role: normalizedRole,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    try {
      await sendEmail({
        to: userToInvite.email,
        subject: translator.t("email.invite.subject", {
          projectName: project.name,
        }),
        html: getProjectMemberInvitationTemplate(
          {
            projectName: project.name,
            inviterEmail: req.user?.email ?? "",
          },
          translator
        ),
        locale: translator.locale,
      });
    } catch (emailError) {
      console.error("Error sending project invitation email", emailError);
    }

    res.status(201).json({
      data: {
        id: newMember.id,
        role: newMember.role,
        createdAt: newMember.createdAt,
        user: newMember.user,
      },
    });
  } catch (error) {
    console.error("Error adding project member", error);
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "project.errors.invite_failure", {
          error,
        })
      );
  }
};

export const removeProjectMember = async (req: Request, res: Response) => {
  let translator = getRequestTranslator(req);
  try {
    const projectId = req.validatedProjectId ?? parseInt(req.params.id, 10);
    const memberId = parseInt(req.params.memberId, 10);

    const membership = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!membership || membership.projectId !== projectId) {
      return res
        .status(404)
        .json(
          buildLocalizedResponse(translator, "project.errors.member_not_found")
        );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { locale: true },
    });

    translator = getRequestTranslator(req, project?.locale);

    const isSelfRemoval = membership.userId === req.user?.id;

    if (!req.projectAccess?.isAdmin && !req.projectAccess?.isOwner && !isSelfRemoval) {
      return res
        .status(403)
        .json(
          buildLocalizedResponse(translator, "project.errors.remove_forbidden")
        );
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error removing project member", error);
    res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "project.errors.remove_failure", {
          error,
        })
      );
  }
};
