import { Request, Response } from "express";
import prisma from "../lib/prisma";

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
    const projects = await prisma.project.findMany({
      where: {
        userId,
      },
    });

    res.json({ data: projects });
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects" });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ data: project });
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
    const { id } = req.params;

    await prisma.project.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting project" });
  }
};
