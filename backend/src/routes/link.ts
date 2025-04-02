import * as linkController from "../controllers/link";

import { authenticateJWT } from "../middleware/auth";
import express from "express";
import { extractProjectContext } from "../middleware/projectContext";

const router = express.Router();

// All routes require authentication and project context
router.use(authenticateJWT);
router.use(extractProjectContext);

// Link CRUD operations
router.get("/project", linkController.getLinksByProject);
router.get("/project/:projectId", linkController.getLinksByProject);
router.get("/:id", linkController.getLinkById);
router.post("/project", linkController.createLink); // Route pour créer
router.put("/:id", linkController.updateLink); // Route pour mettre à jour
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

// Nouvelle route pour les statistiques d'un lien spécifique
router.get("/:id/stats", linkController.getLinkStats);

export default router;
