import { NextFunction, Request, Response } from "express";
import { getFromCache, saveToCache } from "../lib/redis";

import { compare } from "bcrypt";
import prisma from "../lib/prisma";

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60; // 15 minutes in seconds
const SESSION_DURATION = 24 * 60 * 60; // 24 hours in seconds

const IN_MEMORY_CACHE = new Map<string, { value: string; expires: number }>();

// Fallback cache function en cas d'indisponibilité de Redis
const getFallbackCache = (key: string): string | null => {
  const item = IN_MEMORY_CACHE.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    IN_MEMORY_CACHE.delete(key);
    return null;
  }
  return item.value;
};

const setFallbackCache = (
  key: string,
  value: string,
  ttlSeconds: number
): void => {
  IN_MEMORY_CACHE.set(key, {
    value,
    expires: Date.now() + ttlSeconds * 1000,
  });
};

export const validateLinkPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const shortCode = req.params.path;
  const password = req.body.password;
  const ip = (req.headers["cf-connecting-ip"] as string) || req.ip || "0.0.0.0";

  try {
    // Check rate limit
    const attemptsKey = `password_attempts:${shortCode}:${ip}`;
    let attempts: number;

    try {
      attempts = parseInt((await getFromCache(attemptsKey)) || "0");
    } catch (error) {
      // Fallback to in-memory cache if Redis fails
      attempts = parseInt(getFallbackCache(attemptsKey) || "0");
    }

    if (attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({
        message: "Too many failed attempts. Please try again later.",
        blockDuration: BLOCK_DURATION,
      });
    }

    // Get link data
    const link = await prisma.link.findUnique({
      where: { shortCode },
      select: { id: true, isPasswordProtected: true, passwordHash: true },
    });

    if (!link || !link.isPasswordProtected || !link.passwordHash) {
      return res.status(400).json({ message: "Invalid request" });
    }

    // Validate password
    const isValid = await compare(password, link.passwordHash);

    if (!isValid) {
      // Increment failed attempts
      try {
        await saveToCache(
          attemptsKey,
          (attempts + 1).toString(),
          BLOCK_DURATION
        );
      } catch (error) {
        // Fallback to in-memory cache if Redis fails
        setFallbackCache(
          attemptsKey,
          (attempts + 1).toString(),
          BLOCK_DURATION
        );
      }
      return res.status(401).json({ message: "Invalid password" });
    }

    // Clear failed attempts
    try {
      await saveToCache(attemptsKey, "0", 1);
    } catch (error) {
      setFallbackCache(attemptsKey, "0", 1);
    }

    // Create session token
    const sessionToken = Math.random().toString(36).substring(2);
    const sessionKey = `link_session:${shortCode}:${sessionToken}`;

    try {
      await saveToCache(sessionKey, "valid", SESSION_DURATION);
    } catch (error) {
      setFallbackCache(sessionKey, "valid", SESSION_DURATION);
    }

    // Set session cookie
    res.cookie("link_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_DURATION * 1000,
      sameSite: "lax",
    });

    next();
  } catch (error) {
    console.error("Password validation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkPasswordSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const shortCode = req.params.path;
  const sessionToken = req.cookies.link_session;

  try {
    // Check if link requires password
    const link = await prisma.link.findUnique({
      where: { shortCode },
      select: { isPasswordProtected: true },
    });

    if (!link?.isPasswordProtected) {
      return next();
    }

    if (!sessionToken) {
      return res.status(401).json({ message: "Password required" });
    }

    // Validate session
    const sessionKey = `link_session:${shortCode}:${sessionToken}`;
    let isValid: string | null;

    try {
      isValid = await getFromCache(sessionKey);
    } catch (error) {
      // Fallback to in-memory cache if Redis fails
      isValid = getFallbackCache(sessionKey);
    }

    if (!isValid) {
      return res.status(401).json({ message: "Password required" });
    }

    next();
  } catch (error) {
    console.error("Session validation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
