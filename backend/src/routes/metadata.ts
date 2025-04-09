import { Router } from "express";
import { getMetadata, proxyImage } from "../controllers/metadata";
import { authenticateJWT } from "../middleware/auth";

const router = Router();

router.get("/", authenticateJWT, getMetadata);
router.get("/proxy-image", proxyImage); // Removed authenticateJWT for public access

export default router;
