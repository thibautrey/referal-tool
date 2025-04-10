import * as projectController from "../controllers/project";

import { authenticateJWT, isAdmin } from "../middleware/auth";

import { Router } from "express";
import { validateProjectAccess } from "../middleware/projectAccess";

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Admin routes
router.get("/", isAdmin, projectController.getProjects);

// Non-admin routes with project access validation
router.get("/:id", validateProjectAccess, projectController.getProjectById);
router.post("/", projectController.createProject);
router.put("/:id", validateProjectAccess, projectController.updateProject);
router.delete("/:id", validateProjectAccess, projectController.deleteProject);

// Project specific analytics
router.get(
  "/:id/stats",
  validateProjectAccess,
  projectController.getProjectStats
);
router.get(
  "/:id/links",
  validateProjectAccess,
  projectController.getProjectLinks
);

export default router;
