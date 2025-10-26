import { NextFunction, Request, Response } from "express";
import { getFromCache, saveToCache } from "../lib/redis";

import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import {
  buildLocalizedResponse,
  createTranslator,
} from "../lib/i18n";

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_SECONDS = 15 * 60; // 15 minutes

function getRateLimitKey(path: string, ip: string | undefined) {
  const clientIp = ip || "unknown";
  return `link_attempts:${path}:${clientIp}`;
}

// Check if the session is valid for password-protected links
export const checkPasswordSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.params.path;
  const translator = createTranslator({ req });

  try {
    const link = await prisma.link.findFirst({
      where: {
        shortCode: path,
        active: true,
        isPasswordProtected: true,
      },
    });

    if (!link) {
      return next(); // No password protection, continue
    }

    const sessionToken = req.cookies.link_session;
    if (!sessionToken) {
      return res
        .status(401)
        .json(
          buildLocalizedResponse(
            translator,
            "link.password.session_required"
          )
        );
    }

    const sessionKey = `link_session:${path}:${sessionToken}`;
    const isValid = await getFromCache(sessionKey);

    if (!isValid) {
      return res
        .status(401)
        .json(
          buildLocalizedResponse(
            translator,
            "link.password.session_invalid"
          )
        );
    }

    next();
  } catch (error) {
    console.error("Error checking password session:", error);
    return res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "common.errors.unexpected", {
          error,
        })
      );
  }
};

// Validate password for password-protected links
export const validateLinkPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { path } = req.params;
  const { password } = req.body;
  const translator = createTranslator({ req });
  const clientIp =
    (req.headers["cf-connecting-ip"] as string | undefined) || req.ip;
  const rateLimitKey = getRateLimitKey(path, clientIp);

  try {
    if (!password) {
      return res
        .status(400)
        .json(
          buildLocalizedResponse(translator, "link.password.missing")
        );
    }

    const link = await prisma.link.findFirst({
      where: {
        shortCode: path,
        active: true,
        isPasswordProtected: true,
      },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!link || !link.passwordHash) {
      return res
        .status(404)
        .json(
          buildLocalizedResponse(translator, "link.password.not_found")
        );
    }

    const attemptsRaw = await getFromCache(rateLimitKey);
    const attempts = attemptsRaw ? parseInt(String(attemptsRaw), 10) || 0 : 0;
    if (attempts >= MAX_ATTEMPTS) {
      return res.status(429).json(
        buildLocalizedResponse(translator, "link.password.rate_limited", {
          extra: { blockDuration: BLOCK_DURATION_SECONDS },
        })
      );
    }

    const isValid = await bcrypt.compare(password, link.passwordHash);
    if (!isValid) {
      const nextAttempts = attempts + 1;
      await saveToCache(
        rateLimitKey,
        String(nextAttempts),
        BLOCK_DURATION_SECONDS
      );
      return res
        .status(401)
        .json(
          buildLocalizedResponse(translator, "link.password.invalid", {
            extra: { attempts: nextAttempts },
          })
        );
    }

    // Create a session token
    const sessionToken = uuidv4();
    const sessionKey = `link_session:${path}:${sessionToken}`;

    // Store session in Redis with 24-hour expiry
    await saveToCache(sessionKey, "valid", 24 * 60 * 60);
    await saveToCache(rateLimitKey, "0", BLOCK_DURATION_SECONDS);

    // Set cookie with session token (24-hour expiry)
    res.cookie("link_session", sessionToken, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json(
      buildLocalizedResponse(translator, "link.password.validated", {
        extra: { sessionToken },
      })
    );
  } catch (error) {
    console.error("Error validating password:", error);
    return res
      .status(500)
      .json(
        buildLocalizedResponse(translator, "common.errors.unexpected", {
          error,
        })
      );
  }
};
