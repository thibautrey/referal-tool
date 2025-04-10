import { NextFunction, Request, Response } from "express";
import {
  checkPasswordSession,
  validateLinkPassword,
} from "../../src/middleware/passwordProtection";
import { compare, hash } from "bcrypt";
import { getFromCache, saveToCache } from "../../src/lib/redis";

import prisma from "../../src/lib/prisma";

jest.mock("../../src/lib/prisma");
jest.mock("../../src/lib/redis");
jest.mock("bcrypt");

describe("Password Protection Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: { path: "test-link" },
      body: { password: "testpass" },
      ip: "127.0.0.1",
      cookies: {},
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("validateLinkPassword", () => {
    it("should validate correct password and set session", async () => {
      const mockLink = {
        id: 1,
        isPasswordProtected: true,
        passwordHash: "hashedPassword",
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(mockLink);
      (compare as jest.Mock).mockResolvedValue(true);
      (saveToCache as jest.Mock).mockResolvedValue(true);

      await validateLinkPassword(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.cookie).toHaveBeenCalled();
    });

    it("should reject invalid password", async () => {
      const mockLink = {
        id: 1,
        isPasswordProtected: true,
        passwordHash: "hashedPassword",
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(mockLink);
      (compare as jest.Mock).mockResolvedValue(false);

      await validateLinkPassword(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid password",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should handle rate limiting", async () => {
      (getFromCache as jest.Mock).mockResolvedValue("5"); // Max attempts reached

      await validateLinkPassword(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Too many failed attempts. Please try again later.",
        blockDuration: 900,
      });
    });
  });

  describe("checkPasswordSession", () => {
    it("should pass through if link is not password protected", async () => {
      const mockLink = {
        isPasswordProtected: false,
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(mockLink);

      await checkPasswordSession(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it("should validate valid session token", async () => {
      const mockLink = {
        isPasswordProtected: true,
      };

      mockRequest.cookies = {
        link_session: "valid-token",
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(mockLink);
      (getFromCache as jest.Mock).mockResolvedValue("valid");

      await checkPasswordSession(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it("should reject invalid session token", async () => {
      const mockLink = {
        isPasswordProtected: true,
      };

      mockRequest.cookies = {
        link_session: "invalid-token",
      };

      (prisma.link.findUnique as jest.Mock).mockResolvedValue(mockLink);
      (getFromCache as jest.Mock).mockResolvedValue(null);

      await checkPasswordSession(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Password required",
      });
    });
  });
});
