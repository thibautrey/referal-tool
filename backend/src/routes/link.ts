import * as linkController from "../controllers/link";

import { authenticateJWT } from "../middleware/auth";
import express from "express";
import { extractProjectContext } from "../middleware/projectContext";

const router = express.Router();

// All routes require authentication and project context
router.use(authenticateJWT);
router.use(extractProjectContext);

// Link CRUD operations
router.get("/project", linkController.getLinksByProject); // New route for default project
router.get("/project/:projectId", linkController.getLinksByProject);
router.post("/project", linkController.createLink); // New route for default project
router.post("/project/:projectId", linkController.createLink);
router.get("/:id", linkController.getLinkById);
router.put("/:id", linkController.updateLink);
router.delete("/:id", linkController.deleteLink);

// Nouvelle route pour vérifier la disponibilité du code court
router.get(
  "/check-short-code/:code",
  linkController.checkShortCodeAvailability
);

// Link rules operations
router.post("/:linkId/rules", linkController.addRule);
router.put("/rules/:ruleId", linkController.updateRule);
router.delete("/rules/:ruleId", linkController.deleteRule);

export default router;
