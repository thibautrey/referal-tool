import * as authController from "../controllers/auth";
import * as userController from "../controllers/user";

import { authenticateJWT } from "../middleware/auth";
import express from "express";

const router = express.Router();

// Routes utilisateur standard
router.get("/", authenticateJWT, userController.getUsers);
router.post("/", authenticateJWT, userController.createUser);

// Route pour récupérer l'utilisateur actuellement connecté
// Note: La route spécifique "/me" doit être placée AVANT les routes avec des paramètres "/:id"
router.get("/me", authenticateJWT, userController.getCurrentUser);

// Routes paramétrées
router.get("/:id", authenticateJWT, userController.getUserById);
router.put("/:id", authenticateJWT, userController.updateUser);
router.delete("/:id", authenticateJWT, userController.deleteUser);

// Routes d'authentification
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/change-password", authenticateJWT, authController.changePassword);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Routes OTP
router.post("/setup-otp", authenticateJWT, authController.setupOTP);
router.post("/verify-otp", authenticateJWT, authController.verifyOTP);
router.post("/disable-otp", authenticateJWT, authController.disableOTP);
router.get("/backup-codes", authenticateJWT, authController.getBackupCodes);

export default router;
