import * as analyticsController from "../controllers/analytics";

import { authenticateJWT } from "../middleware/auth";
import express from "express";
import { extractProjectContext } from "../middleware/projectContext";
import { validateProjectAccess } from "../middleware/projectAccess";

const router = express.Router();

// Toutes les routes nécessitent une authentification et validation du projet
router.use(authenticateJWT);
router.use(extractProjectContext);
router.use(validateProjectAccess);

// Routes pour les statistiques de visites
router.get("/visits", analyticsController.getVisitStats);
router.get("/dashboard", analyticsController.getDashboardStats);

export default router;
