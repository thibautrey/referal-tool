import * as analyticsController from "../controllers/analytics";

import { authenticateJWT } from "../middleware/auth";
import express from "express";
import { extractProjectContext } from "../middleware/projectContext";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateJWT);
router.use(extractProjectContext);

// Routes pour les statistiques de visites
router.get("/visits", analyticsController.getVisitStats);
router.get("/dashboard", analyticsController.getDashboardStats);

export default router;
