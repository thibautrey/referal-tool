import { ProjectMemberRole } from "@prisma/client";
import { Request, Response } from "express";

import prisma from "../lib/prisma";
import { getProjectMemberInvitationTemplate } from "../templates/project-member-invite";
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

export const getProjects = async (req: Request, res: Response) => {
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
    res.status(500).json({ message: "Error fetching projects" });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
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
      return res.status(404).json({ message: "Project not found" });
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
    res.status(500).json({ message: "Error fetching project" });
  }
};

export const getProjectLinks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Validate page and limit
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.max(Number(limit) || 10, 1);

    // Validate sort field
    if (!ALLOWED_SORT_FIELDS.includes(sortBy as string)) {
      sortBy = "createdAt";
    }

    const links = await prisma.link.findMany({
      where: { projectId: parseInt(id) },
      orderBy: { [sortBy as string]: sortOrder },
      take: limitNumber,
      skip: (pageNumber - 1) * limitNumber,
    });

    const total = await prisma.link.count({
      where: { projectId: parseInt(id) },
    });

    res.json({
      data: {
        links,
        total,
        page: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Error fetching project links", error);
    res.status(500).json({ message: "Error fetching project links" });
  }
};

export const getProjectStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Implement project stats logic here
    res.json({ data: {} });
  } catch (error) {
    res.status(500).json({ message: "Error fetching project stats" });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        user: {
          connect: { id: userId },
        },
      },
    });

    res.status(201).json({ data: project });
  } catch (error) {
    res.status(500).json({ message: "Error creating project" });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    if (!req.projectAccess?.isOwner && !req.projectAccess?.isAdmin) {
      return res.status(403).json({ message: "Only project owners can update" });
    }
    const { id } = req.params;
    const { name, description } = req.body;

    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: { name, description },
    });

    res.json({ data: project });
  } catch (error) {
    res.status(500).json({ message: "Error updating project" });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    if (!req.projectAccess?.isOwner && !req.projectAccess?.isAdmin) {
      return res.status(403).json({ message: "Only project owners can delete" });
    }
    const { id } = req.params;

    await prisma.project.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting project" });
  }
};

export const getProjectMembers = async (req: Request, res: Response) => {
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
      return res.status(404).json({ message: "Project not found" });
    }

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
    res.status(500).json({ message: "Error fetching project members" });
  }
};

export const addProjectMember = async (req: Request, res: Response) => {
  try {
    if (!req.projectAccess?.isOwner && !req.projectAccess?.isAdmin) {
      return res.status(403).json({ message: "Only project owners can invite members" });
    }

    const projectId = req.validatedProjectId ?? parseInt(req.params.id, 10);
    const { email, role = ProjectMemberRole.MEMBER } = req.body as {
      email?: string;
      role?: ProjectMemberRole;
    };

    if (!email) {
      return res.status(400).json({ message: "Member email is required" });
    }

    const userToInvite = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToInvite) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToInvite.id === req.user?.id) {
      return res
        .status(400)
        .json({ message: "Owners do not need to invite themselves" });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { user: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.userId === userToInvite.id) {
      return res
        .status(400)
        .json({ message: "The project owner already has access" });
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
        .json({ message: "User is already a project member" });
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
        subject: `You've been invited to ${project.name}`,
        html: getProjectMemberInvitationTemplate({
          projectName: project.name,
          inviterEmail: req.user?.email ?? "",
        }),
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
    res.status(500).json({ message: "Error adding project member" });
  }
};

export const removeProjectMember = async (req: Request, res: Response) => {
  try {
    const projectId = req.validatedProjectId ?? parseInt(req.params.id, 10);
    const memberId = parseInt(req.params.memberId, 10);

    const membership = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!membership || membership.projectId !== projectId) {
      return res.status(404).json({ message: "Project member not found" });
    }

    const isSelfRemoval = membership.userId === req.user?.id;

    if (!req.projectAccess?.isAdmin && !req.projectAccess?.isOwner && !isSelfRemoval) {
      return res
        .status(403)
        .json({ message: "Not authorized to remove this member" });
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error removing project member", error);
    res.status(500).json({ message: "Error removing project member" });
  }
};
