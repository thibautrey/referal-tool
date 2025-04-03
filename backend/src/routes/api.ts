import express, { Request, Response } from "express";

import linkRoutes from "./link";
import userRoutes from "./user";

const router = express.Router();

// Routes statut
router.get("/status", (_req: Request, res: Response) => {
  res.json({ status: "API is running" });
});

// Utilisation du routeur utilisateur
router.use("/users", userRoutes);
router.use("/links", linkRoutes);

export default router;
