import { Request, Response } from "express";

import { ControllerFunction } from "../types";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import speakeasy from "speakeasy";

interface ApiResponse {
  message: string;
  data?: any;
  error?: any;
}

// Signup
export const signup: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({
        message: "Un utilisateur avec cet email existe déjà",
      });
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response: ApiResponse = {
      message: "Inscription réussie",
      data: newUser,
    };

    res.status(201).json(response);
    return;
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de l'inscription",
      error,
    });
    return;
  }
};

// Login
export const login: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password, otp } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        projects: true,
      },
    });

    if (!user) {
      res.status(401).json({
        message: "Email ou mot de passe incorrect",
      });
      return;
    }

    // Vérifier si l'utilisateur est actif
    if (!user.active) {
      res.status(401).json({
        message: "Ce compte est désactivé",
      });
      return;
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        message: "Email ou mot de passe incorrect",
      });
      return;
    }

    // Vérifier si l'utilisateur a au moins un projet
    if (user.projects.length === 0) {
      // Créer un projet par défaut
      await prisma.project.create({
        data: {
          name: "Mon premier projet",
          description: "Projet créé automatiquement",
          userId: user.id,
        },
      });
    }

    // Vérifier l'OTP si activé
    if (user.otpEnabled && user.otpVerified) {
      if (!otp) {
        res.status(400).json({
          message: "Code OTP requis",
          requireOtp: true,
        });
        return;
      }

      // Vérifier le code OTP
      const isOtpValid = speakeasy.totp.verify({
        secret: user.otpSecret!,
        encoding: "base32",
        token: otp,
      });

      if (!isOtpValid) {
        // Vérifier si c'est un code de secours
        const backupCodes = user.otpBackupCodes
          ? JSON.parse(user.otpBackupCodes)
          : [];

        const backupCodeIndex = backupCodes.indexOf(otp);
        if (backupCodeIndex === -1) {
          res.status(401).json({
            message: "Code OTP invalide",
          });
          return;
        }

        // Supprimer le code de secours utilisé
        backupCodes.splice(backupCodeIndex, 1);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            otpBackupCodes: JSON.stringify(backupCodes),
          },
        });
      }
    }

    // Créer le token JWT
    const secret = process.env.JWT_SECRET || "votre_clé_secrète_par_défaut";
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: "24h" }
    );

    const defaultProjectId =
      user.projects.length > 0 ? user.projects[0].id : null;

    const response: ApiResponse = {
      message: "Connexion réussie",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          defaultProjectId,
        },
      },
    };

    res.json(response);
    return;
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la connexion",
      error,
    });
    return;
  }
};

// Logout (côté serveur, principalement pour la gestion des jetons)
export const logout: ControllerFunction = async (
  _req: Request,
  res: Response
) => {
  // Comme nous utilisons JWT, le logout est géré côté client
  // Le serveur peut potentiellement gérer une liste noire de jetons
  res.json({
    message: "Déconnexion réussie",
  });
  return;
};

// Configurer l'OTP
export const setupOTP: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        message: "Utilisateur non authentifié",
      });
      return;
    }

    // Générer un secret OTP
    const secret = speakeasy.generateSecret({
      name: `Referal-Tool:${req.user?.email}`,
    });

    // Générer des codes de secours
    const backupCodes = Array(8)
      .fill(0)
      .map(() => crypto.randomBytes(4).toString("hex"));

    // Mettre à jour l'utilisateur avec le secret OTP
    await prisma.user.update({
      where: { id: userId },
      data: {
        otpSecret: secret.base32,
        otpEnabled: true,
        otpVerified: false,
        otpBackupCodes: JSON.stringify(backupCodes),
      },
    });

    res.json({
      message: "Configuration OTP initiée",
      data: {
        otpSecret: secret.base32,
        otpAuthUrl: secret.otpauth_url,
        backupCodes,
      },
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la configuration OTP",
      error,
    });
    return;
  }
};

// Vérifier l'OTP
export const verifyOTP: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const { token } = req.body;

    if (!userId) {
      res.status(401).json({
        message: "Utilisateur non authentifié",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.otpSecret) {
      res.status(400).json({
        message: "Configuration OTP non trouvée",
      });
      return;
    }

    // Vérifier le token OTP
    const verified = speakeasy.totp.verify({
      secret: user.otpSecret,
      encoding: "base32",
      token,
    });

    if (!verified) {
      res.status(400).json({
        message: "Code OTP invalide",
      });
      return;
    }

    // Marquer l'OTP comme vérifié
    await prisma.user.update({
      where: { id: userId },
      data: {
        otpVerified: true,
      },
    });

    res.json({
      message: "OTP vérifié avec succès",
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la vérification OTP",
      error,
    });
    return;
  }
};

// Désactiver l'OTP
export const disableOTP: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        message: "Utilisateur non authentifié",
      });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        otpSecret: null,
        otpEnabled: false,
        otpVerified: false,
        otpBackupCodes: null,
      },
    });

    res.json({
      message: "OTP désactivé avec succès",
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la désactivation OTP",
      error,
    });
    return;
  }
};

// Récupérer les codes de secours
export const getBackupCodes: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        message: "Utilisateur non authentifié",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.otpBackupCodes) {
      res.status(400).json({
        message: "Aucun code de secours trouvé",
      });
      return;
    }

    res.json({
      message: "Codes de secours récupérés",
      data: {
        backupCodes: JSON.parse(user.otpBackupCodes),
      },
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des codes de secours",
      error,
    });
    return;
  }
};

// Changer le mot de passe
export const changePassword: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({
        message: "Utilisateur non authentifié",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        message: "Utilisateur non trouvé",
      });
      return;
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      res.status(401).json({
        message: "Mot de passe actuel incorrect",
      });
      return;
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    res.json({
      message: "Mot de passe changé avec succès",
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors du changement de mot de passe",
      error,
    });
    return;
  }
};

// Mot de passe oublié - Demande de réinitialisation
export const forgotPassword: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({
        message: "Aucun compte associé à cet email",
      });
      return;
    }

    // Générer un token de réinitialisation
    const secret = process.env.JWT_SECRET || "votre_clé_secrète_par_défaut";
    const resetToken = jwt.sign(
      { id: user.id, action: "reset_password" },
      secret,
      { expiresIn: "1h" }
    );

    // Stocker le token (dans une vraie application, vous devriez stocker ce token en base de données)
    // Pour simplifier, nous envoyons simplement le token dans la réponse
    // Dans une application réelle, vous enverriez un email avec un lien contenant ce token

    // Exemple de code pour envoyer un email (commenté car mock)
    /*
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Réinitialisation de mot de passe",
      html: `
        <p>Vous avez demandé une réinitialisation de mot de passe.</p>
        <p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
        <a href="${process.env.APP_URL}/reset-password?token=${resetToken}">Réinitialiser mon mot de passe</a>
      `,
    });
    */

    res.json({
      message: "Instructions de réinitialisation envoyées à votre email",
      // Pour les besoins de développement uniquement, envoyer le token dans la réponse
      data: { resetToken },
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la demande de réinitialisation",
      error,
    });
    return;
  }
};

// Réinitialiser le mot de passe
export const resetPassword: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { token, newPassword } = req.body;
    const secret = process.env.JWT_SECRET || "votre_clé_secrète_par_défaut";

    // Vérifier le token
    try {
      const decoded = jwt.verify(token, secret) as {
        id: number;
        action: string;
      };

      if (decoded.action !== "reset_password") {
        res.status(400).json({
          message: "Token invalide",
        });
        return;
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: decoded.id },
        data: {
          password: hashedPassword,
        },
      });

      res.json({
        message: "Mot de passe réinitialisé avec succès",
      });
      return;
    } catch (error) {
      res.status(401).json({
        message: "Token invalide ou expiré",
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la réinitialisation du mot de passe",
      error,
    });
    return;
  }
};
