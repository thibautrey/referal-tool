import express from "express";
import { authenticateJWT } from "../middleware/auth";
import { createApiKey, deleteApiKey, listApiKeys } from "../controllers/apiKey";

const router = express.Router();

router.get("/", authenticateJWT, listApiKeys);
router.post("/", authenticateJWT, createApiKey);
router.delete("/:id", authenticateJWT, deleteApiKey);

export default router;
