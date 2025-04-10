import { NextFunction, Request, Response } from "express";
import { getFromCache, saveToCache } from "../lib/redis";

import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";

// Check if the session is valid for password-protected links
export const checkPasswordSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.params.path;

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
      return res.status(401).json({ error: "Password required" });
    }

    const sessionKey = `link_session:${path}:${sessionToken}`;
    const isValid = await getFromCache(sessionKey);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    next();
  } catch (error) {
    console.error("Error checking password session:", error);
    return res.status(500).json({ error: "Internal server error" });
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

  try {
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
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
        .json({ error: "Link not found or not password protected" });
    }

    const isValid = await bcrypt.compare(password, link.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Create a session token
    const sessionToken = uuidv4();
    const sessionKey = `link_session:${path}:${sessionToken}`;

    // Store session in Redis with 24-hour expiry
    await saveToCache(sessionKey, "valid", 24 * 60 * 60);

    // Set cookie with session token (24-hour expiry)
    res.cookie("link_session", sessionToken, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ message: "Password validated successfully" });
  } catch (error) {
    console.error("Error validating password:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
