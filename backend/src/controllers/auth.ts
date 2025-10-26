import { Request, Response } from "express";

import { ControllerFunction } from "../types";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import speakeasy from "speakeasy";
import { sendEmail } from "../utils/email";
import { buildLocalizedResponse, createTranslator } from "../lib/i18n";

// Signup
export const signup: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  const translator = createTranslator({ req });
  try {
    const { email, firstName, lastName, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res
        .status(400)
        .json(buildLocalizedResponse(translator, "auth.signup.exists"));
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: "USER",
        locale: translator.locale,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response = buildLocalizedResponse(translator, "auth.signup.success", {
      data: newUser,
    });

    res.status(201).json(response);
    return;
  } catch (error) {
    res
      .status(500)
      .json(buildLocalizedResponse(translator, "auth.signup.error", { error }));
    return;
  }
};

// Login
export const login: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  let translator = createTranslator({ req });
  try {
    const { email, password, otp } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        projects: true,
      },
    });

    if (!user) {
      res
        .status(401)
        .json(
          buildLocalizedResponse(translator, "auth.login.invalid_credentials")
        );
      return;
    }

    translator = createTranslator({ req, userLocale: user.locale });

    if (!user.active) {
      res
        .status(401)
        .json(buildLocalizedResponse(translator, "auth.login.account_inactive"));
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res
        .status(401)
        .json(
          buildLocalizedResponse(translator, "auth.login.invalid_credentials")
        );
      return;
    }

    let newProjectCreated;
    if (user.projects.length === 0) {
      await prisma.project.create({
        data: {
          name: translator.t("project.default.name"),
          description: translator.t("project.default.description"),
          userId: user.id,
          locale: translator.locale,
        },
      });

      newProjectCreated = await prisma.project.findFirst({
        where: {
          userId: user.id,
        },
      });
    }

    if (user.otpEnabled && user.otpVerified) {
      if (!otp) {
        res.status(400).json(
          buildLocalizedResponse(translator, "auth.login.otp_required", {
            extra: { requireOtp: true },
          })
        );
        return;
      }

      const isOtpValid = speakeasy.totp.verify({
        secret: user.otpSecret!,
        encoding: "base32",
        token: otp,
      });

      if (!isOtpValid) {
        const backupCodes = user.otpBackupCodes
          ? JSON.parse(user.otpBackupCodes)
          : [];

        const backupCodeIndex = backupCodes.indexOf(otp);
        if (backupCodeIndex === -1) {
          res
            .status(401)
            .json(buildLocalizedResponse(translator, "auth.otp.invalid"));
          return;
        }

        backupCodes.splice(backupCodeIndex, 1);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            otpBackupCodes: JSON.stringify(backupCodes),
          },
        });
      }
    }

    const secret = process.env.JWT_SECRET || "votre_clé_secrète_par_défaut";
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: "24h" }
    );

    const defaultProjectId =
      user.projects.length > 0
        ? user.projects[0].id
        : newProjectCreated!.id;

    const response = buildLocalizedResponse(translator, "auth.login.success", {
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          defaultProjectId,
          locale: user.locale ?? translator.locale,
        },
      },
    });

    res.json(response);
    return;
  } catch (error) {
    res
      .status(500)
      .json(buildLocalizedResponse(translator, "auth.login.error", { error }));
    return;
  }
};

// Logout (côté serveur, principalement pour la gestion des jetons)
export const logout: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  const translator = createTranslator({ req, userLocale: req.user?.locale });
  res.json(buildLocalizedResponse(translator, "auth.logout.success"));
  return;
};

// Configurer l'OTP
export const setupOTP: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  let translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json(buildLocalizedResponse(translator, "common.errors.unauthenticated"));
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true },
    });

    translator = createTranslator({ req, userLocale: user?.locale });

    res.json(
      buildLocalizedResponse(translator, "auth.otp.setup_started", {
        data: {
          otpSecret: secret.base32,
          otpAuthUrl: secret.otpauth_url,
          backupCodes,
        },
      })
    );
    return;
  } catch (error) {
    res.status(500).json(
      buildLocalizedResponse(translator, "auth.otp.setup_error", { error })
    );
    return;
  }
};

// Vérifier l'OTP
export const verifyOTP: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  let translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    const userId = req.user?.id;
    const { token } = req.body;

    if (!userId) {
      res
        .status(401)
        .json(buildLocalizedResponse(translator, "common.errors.unauthenticated"));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    translator = createTranslator({ req, userLocale: user?.locale });

    if (!user || !user.otpSecret) {
      res
        .status(400)
        .json(buildLocalizedResponse(translator, "auth.otp.config_missing"));
      return;
    }

    // Vérifier le token OTP
    const verified = speakeasy.totp.verify({
      secret: user.otpSecret,
      encoding: "base32",
      token,
    });

    if (!verified) {
      res
        .status(400)
        .json(buildLocalizedResponse(translator, "auth.otp.invalid"));
      return;
    }

    // Marquer l'OTP comme vérifié
    await prisma.user.update({
      where: { id: userId },
      data: {
        otpVerified: true,
      },
    });

    res.json(buildLocalizedResponse(translator, "auth.otp.verified"));
    return;
  } catch (error) {
    res.status(500).json(
      buildLocalizedResponse(translator, "auth.otp.verify_error", { error })
    );
    return;
  }
};

// Désactiver l'OTP
export const disableOTP: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  const translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json(buildLocalizedResponse(translator, "common.errors.unauthenticated"));
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

    res.json(buildLocalizedResponse(translator, "auth.otp.disabled"));
    return;
  } catch (error) {
    res.status(500).json(
      buildLocalizedResponse(translator, "auth.otp.disable_error", { error })
    );
    return;
  }
};

// Récupérer les codes de secours
export const getBackupCodes: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  let translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json(buildLocalizedResponse(translator, "common.errors.unauthenticated"));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    translator = createTranslator({ req, userLocale: user?.locale });

    if (!user || !user.otpBackupCodes) {
      res
        .status(400)
        .json(buildLocalizedResponse(translator, "auth.otp.backup_missing"));
      return;
    }

    res.json(
      buildLocalizedResponse(translator, "auth.otp.backup_retrieved", {
        data: {
          backupCodes: JSON.parse(user.otpBackupCodes),
        },
      })
    );
    return;
  } catch (error) {
    res.status(500).json(
      buildLocalizedResponse(translator, "auth.otp.backup_error", { error })
    );
    return;
  }
};

// Changer le mot de passe
export const changePassword: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  let translator = createTranslator({ req, userLocale: req.user?.locale });
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res
        .status(401)
        .json(buildLocalizedResponse(translator, "common.errors.unauthenticated"));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res
        .status(404)
        .json(buildLocalizedResponse(translator, "common.errors.user_not_found"));
      return;
    }

    translator = createTranslator({ req, userLocale: user.locale });

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      res
        .status(401)
        .json(buildLocalizedResponse(translator, "auth.password.current_invalid"));
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

    res.json(buildLocalizedResponse(translator, "auth.password.changed"));
    return;
  } catch (error) {
    res.status(500).json(
      buildLocalizedResponse(translator, "auth.password.change_error", { error })
    );
    return;
  }
};

// Mot de passe oublié - Demande de réinitialisation
export const forgotPassword: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  let translator = createTranslator({ req });
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res
        .status(500)
        .json(
          buildLocalizedResponse(translator, "auth.password.reset_request_error")
        );
      return;
    }

    translator = createTranslator({ req, userLocale: user.locale });

    // Générer un token de réinitialisation
    const secret = process.env.JWT_SECRET || "votre_clé_secrète_par_défaut";
    const resetToken = jwt.sign(
      { id: user.id, action: "reset_password" },
      secret,
      { expiresIn: "1h" }
    );

    const resetLink = `${process.env.APP_URL}/app/reset-password?token=${resetToken}`;

    // Send email with Resend
    const emailSent = await sendEmail({
      to: user.email,
      subject: translator.t("email.reset.subject"),
      html: `
        <p>${translator.t("email.reset.intro")}</p>
        <p>${translator.t("email.reset.instructions")}</p>
        <a href="${resetLink}">${translator.t("email.reset.link_text")}</a>
      `,
      locale: translator.locale,
    });

    if (!emailSent) {
      res
        .status(500)
        .json(
          buildLocalizedResponse(translator, "auth.password.reset_email_failed")
        );
      return;
    }

    res.json(
      buildLocalizedResponse(translator, "auth.password.reset_email_sent", {
        data: { resetToken },
      })
    );
    return;
  } catch (error) {
    res.status(500).json(
      buildLocalizedResponse(translator, "auth.password.reset_request_error", {
        error,
      })
    );
    return;
  }
};

// Réinitialiser le mot de passe
export const resetPassword: ControllerFunction = async (
  req: Request,
  res: Response
) => {
  let translator = createTranslator({ req });
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
        res
          .status(400)
          .json(
            buildLocalizedResponse(
              translator,
              "auth.password.reset_token_invalid"
            )
          );
        return;
      }

      const account = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, locale: true },
      });

      translator = createTranslator({ req, userLocale: account?.locale });

      if (!account) {
        res
          .status(404)
          .json(buildLocalizedResponse(translator, "common.errors.user_not_found"));
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

      res.json(buildLocalizedResponse(translator, "auth.password.reset_success"));
      return;
    } catch (error) {
      res
        .status(401)
        .json(
          buildLocalizedResponse(
            translator,
            "common.errors.token_invalid_or_expired"
          )
        );
      return;
    }
  } catch (error) {
    res.status(500).json(
      buildLocalizedResponse(translator, "auth.password.reset_error", { error })
    );
    return;
  }
};
