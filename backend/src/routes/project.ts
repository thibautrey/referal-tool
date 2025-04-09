import * as projectController from "../controllers/project";
import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Project routes
router.get("/", projectController.getProjects);
router.get("/:id", projectController.getProjectById);
router.post("/", projectController.createProject);
router.put("/:id", projectController.updateProject);
router.delete("/:id", projectController.deleteProject);

// Project specific analytics
router.get("/:id/stats", projectController.getProjectStats);
router.get("/:id/links", projectController.getProjectLinks);

export default router;
