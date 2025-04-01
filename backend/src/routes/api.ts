import express, { Request, Response } from "express";
import userRoutes from "./user";

const router = express.Router();

// Routes statut
router.get("/status", (req: Request, res: Response) => {
  res.json({ status: "API is running" });
});

// Utilisation du routeur utilisateur
router.use("/users", userRoutes);

export default router;
