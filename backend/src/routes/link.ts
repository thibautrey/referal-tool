import * as linkController from "../controllers/link";

import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { validateProjectAccess } from "../middleware/projectAccess";

const router = Router();

// All routes require authentication and project access validation
router.use(authenticateJWT);
router.use(validateProjectAccess);

// Link CRUD operations
router.get("/:id", linkController.getLinkById);
router.post("/", linkController.createLink);
router.put("/:id", linkController.updateLink);
router.delete("/:id", linkController.deleteLink);

// Link validation
router.get(
  "/check-short-code/:code",
  linkController.checkShortCodeAvailability
);

// Link rules operations
router.post("/:linkId/rules", linkController.addRule);
router.put("/rules/:ruleId", linkController.updateRule);
router.delete("/rules/:ruleId", linkController.deleteRule);

// Link statistics
router.get("/:id/stats", linkController.getLinkStats);

export default router;
