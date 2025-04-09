import * as cheerio from "cheerio";

import { Request, Response } from "express";

import { URL } from "url";
import { decode } from "he";
import proxyChain from "proxy-chain";
import { sanitizeUrl } from "@braintree/sanitize-url";
import validator from "validator";

const MAX_BODY_SIZE = 1024 * 1024; // 1MB limit
const TIMEOUT = 5000; // 5 seconds timeout
const ALLOWED_PROTOCOLS = ["http:", "https:"];
const MAX_METADATA_LENGTH = 1000; // Maximum length for metadata fields
const VALID_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".ico",
  ".svg",
];

const proxies = process.env.PROXIES_URL
  ? process.env.PROXIES_URL.split(",")
  : [];

async function getWorkingProxy(
  attempt = 0,
  maxAttempts = 3
): Promise<string | null> {
  if (attempt >= maxAttempts || proxies.length === 0) {
    return null;
  }
  try {
    const proxyUrl = proxies[Math.floor(Math.random() * proxies.length)];
    const newProxyUrl = await proxyChain.anonymizeProxy(proxyUrl);
    return newProxyUrl;
  } catch (error) {
    console.log(`Proxy attempt failed ${attempt + 1}/${maxAttempts}`);
    return getWorkingProxy(attempt + 1, maxAttempts);
  }
}

function sanitizeMetadataField(field: string | null): string | null {
  if (!field) return null;

  // Decode HTML entities and trim
  let sanitized = decode(field.trim());

  // Remove any HTML/script tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Remove control characters and normalize whitespace
  sanitized = sanitized
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .replace(/\s+/g, " ");

  // Truncate if too long
  sanitized = sanitized.substring(0, MAX_METADATA_LENGTH);

  return sanitized || null;
}

function validateAndSanitizeImageUrl(
  imageUrl: string | null,
  baseUrl: string
): string | null {
  if (!imageUrl) return null;

  try {
    // Handle relative URLs
    const absoluteUrl = new URL(imageUrl, baseUrl).toString();
    const sanitizedUrl = sanitizeUrl(absoluteUrl);

    // Validate URL structure
    if (
      !validator.isURL(sanitizedUrl, {
        protocols: ["http", "https"],
        require_protocol: true,
      })
    ) {
      return null;
    }

    // Validate file extension
    const hasValidExtension = VALID_IMAGE_EXTENSIONS.some((ext) =>
      sanitizedUrl.toLowerCase().endsWith(ext)
    );
    if (!hasValidExtension) return null;

    return sanitizedUrl;
  } catch {
    return null;
  }
}

function findBestImage($: cheerio.CheerioAPI, baseUrl: string): string | null {
  // Try schema.org image first
  const schemaImage =
    $('meta[itemprop="image"]').attr("content") ||
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content");

  if (schemaImage) {
    return schemaImage;
  }

  // Try to find favicon
  const possibleFavicons = [
    $('link[rel="apple-touch-icon"]').attr("href"),
    $('link[rel="icon"]').attr("href"),
    $('link[rel="shortcut icon"]').attr("href"),
    "/favicon.ico", // fallback to default favicon location
  ];

  return possibleFavicons.find((icon) => icon) || null;
}

export const getMetadata = async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    // Add https if protocol is missing
    let urlWithProtocol = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      urlWithProtocol = `https://${url}`;
    }

    // Validate and sanitize input URL
    const sanitizedUrl = sanitizeUrl(urlWithProtocol);
    if (
      !validator.isURL(sanitizedUrl, {
        protocols: ["http", "https"],
        require_protocol: true,
      })
    ) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Parse URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(sanitizedUrl);
      if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: "Invalid URL protocol" });
      }
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Fetch with timeout, size limit, and security headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    // Get a working proxy
    const proxyUrl = await getWorkingProxy();

    // Configure fetch options with proxy if available
    const fetchOptions: RequestInit = {
      signal: controller.signal,
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0 (compatible; ReferalTool/1.0)",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
    };

    if (proxyUrl) {
      const agent = new (require("https-proxy-agent"))(proxyUrl);
      (fetchOptions as any).agent = agent;
    }

    const response = await fetch(sanitizedUrl, fetchOptions);

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("Failed to fetch URL");
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("text/html")) {
      return res.status(400).json({ error: "URL must point to an HTML page" });
    }

    const text = await response.text();
    const $ = cheerio.load(text, {
      scriptingEnabled: false,
      xml: false,
    });

    // Remove potentially dangerous elements before parsing
    $("script").remove();
    $("style").remove();
    $("iframe").remove();
    $("object").remove();
    $("embed").remove();

    const originalImageUrl = validateAndSanitizeImageUrl(
      findBestImage($, sanitizedUrl),
      sanitizedUrl
    );

    const metadata = {
      title: sanitizeMetadataField(
        ($("title").first().text() ||
          $('meta[property="og:title"]').attr("content") ||
          $('meta[name="twitter:title"]').attr("content")) ??
          null
      ),
      description: sanitizeMetadataField(
        ($('meta[name="description"]').attr("content") ||
          $('meta[property="og:description"]').attr("content") ||
          $('meta[name="twitter:description"]').attr("content")) ??
          null
      ),
      image: originalImageUrl
        ? `/api/metadata/proxy-image?url=${encodeURIComponent(originalImageUrl)}`
        : null,
    };

    // Ensure we have at least some valid data
    if (!metadata.title && !metadata.description && !metadata.image) {
      return res.status(404).json({ error: "No valid metadata found" });
    }

    return res.json({
      success: true,
      data: metadata,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return res.status(408).json({ error: "Request timeout" });
    }
    console.error("Metadata extraction error:", error);
    return res.status(500).json({ error: "Failed to extract metadata" });
  }
};

const ALLOWED_DEV_PORTS = ["3000", "3001", "5173"];

export const proxyImage = async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    const origin = req.get("origin");
    const referer = req.headers.referer;
    const host = req.get("host");

    // Pour le développement local, on vérifie si c'est un port autorisé
    const isLocalhost = host?.includes("localhost:");
    const isAllowedDevPort =
      isLocalhost &&
      ALLOWED_DEV_PORTS.some((port) => host?.includes(`:${port}`));

    if (!isAllowedDevPort && (!origin || !referer || !host)) {
      return res.status(403).json({ error: "Direct access not allowed" });
    }

    const allowedOrigins = [
      `http://${host}`,
      `https://${host}`,
      ...ALLOWED_DEV_PORTS.map((port) => `http://localhost:${port}`),
    ];

    if (
      !isAllowedDevPort &&
      !allowedOrigins.some((allowed) => origin?.startsWith(allowed))
    ) {
      return res.status(403).json({ error: "Direct access not allowed" });
    }

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Image URL is required" });
    }

    const sanitizedUrl = sanitizeUrl(url);
    if (!validateAndSanitizeImageUrl(sanitizedUrl, sanitizedUrl)) {
      return res.status(400).json({ error: "Invalid image URL" });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(sanitizedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ReferalTool/1.0)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      res.setHeader("Content-Type", "application/json");
      return res.json({ image: null });
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/")) {
      res.setHeader("Content-Type", "application/json");
      return res.json({ image: null });
    }

    // Forward the image with proper headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
    // Import Readable from node:stream at the top of the file
    const { Readable } = require("node:stream");
    const nodeStream = Readable.fromWeb(response.body);
    nodeStream.pipe(res);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      res.setHeader("Content-Type", "application/json");
      return res.json({ image: null });
    }
    console.error("Image proxy error:", error);
    res.setHeader("Content-Type", "application/json");
    return res.json({ image: null });
  }
};
