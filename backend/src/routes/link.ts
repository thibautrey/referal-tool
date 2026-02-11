import * as linkController from "../controllers/link";

import {
  checkPasswordSession,
  validateLinkPassword,
} from "../middleware/passwordProtection";

import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";
import { handleRedirection } from "../services/redirection";
import { validateProjectAccess } from "../middleware/projectAccess";

const router = Router();

// All routes require authentication and project access validation
router.use(authenticateJWT);

// List all links (requires no specific project, just user auth)
router.get("/", linkController.getAllLinks);

// Remaining routes require project access validation
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

// Password validation route
router.post("/l/:path/validate", validateLinkPassword, (req, res) => {
  res.json({ message: "Password validated successfully" });
});

// Update redirection route to use password session check
router.get("/l/:path", checkPasswordSession, handleRedirection);

export default router;
