import * as projectController from "../controllers/project";

import { authenticateJWT } from "../middleware/auth";

import { Router } from "express";
import { validateProjectAccess } from "../middleware/projectAccess";

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.get("/", projectController.getProjects);

// Non-admin routes with project access validation
router.get("/:id", validateProjectAccess, projectController.getProjectById);
router.post("/", projectController.createProject);
router.put("/:id", validateProjectAccess, projectController.updateProject);
router.delete("/:id", validateProjectAccess, projectController.deleteProject);

router.get(
  "/:id/members",
  validateProjectAccess,
  projectController.getProjectMembers
);
router.post(
  "/:id/members",
  validateProjectAccess,
  projectController.addProjectMember
);
router.delete(
  "/:id/members/:memberId",
  validateProjectAccess,
  projectController.removeProjectMember
);

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
