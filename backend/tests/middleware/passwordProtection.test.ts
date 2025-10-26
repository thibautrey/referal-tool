import { NextFunction, Request, Response } from "express";
import {
  checkPasswordSession,
  validateLinkPassword,
} from "../../src/middleware/passwordProtection";
import { compare } from "bcrypt";
import { getFromCache, saveToCache } from "../../src/lib/redis";

import prisma from "../../src/lib/prisma";

jest.mock("../../src/lib/prisma");
jest.mock("../../src/lib/redis");
jest.mock("bcrypt");

describe("Password Protection Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  const prismaMock = prisma as unknown as {
    link: {
      findFirst: jest.Mock;
    };
  };
  const redisGetMock = getFromCache as unknown as jest.Mock;
  const redisSaveMock = saveToCache as unknown as jest.Mock;
  const bcryptCompareMock = compare as unknown as jest.Mock;

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
    prismaMock.link.findFirst = jest.fn();
    redisGetMock.mockReset();
    redisSaveMock.mockReset();
    bcryptCompareMock.mockReset();
    redisGetMock.mockResolvedValue(null);
    redisSaveMock.mockResolvedValue(undefined);
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

      prismaMock.link.findFirst.mockResolvedValue(mockLink);
      bcryptCompareMock.mockResolvedValue(true);

      await validateLinkPassword(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "link_session",
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          messageKey: "link.password.validated",
          message: "Password validated successfully.",
          sessionToken: expect.any(String),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should reject invalid password", async () => {
      const mockLink = {
        id: 1,
        isPasswordProtected: true,
        passwordHash: "hashedPassword",
      };

      prismaMock.link.findFirst.mockResolvedValue(mockLink);
      bcryptCompareMock.mockResolvedValue(false);

      await validateLinkPassword(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          messageKey: "link.password.invalid",
          message: "Invalid password.",
          attempts: 1,
        })
      );
      expect(redisSaveMock).toHaveBeenCalledWith(
        expect.stringContaining("link_attempts:"),
        "1",
        expect.any(Number)
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should handle rate limiting", async () => {
      prismaMock.link.findFirst.mockResolvedValue({
        id: 1,
        isPasswordProtected: true,
        passwordHash: "hashedPassword",
      });
      redisGetMock.mockResolvedValue("5"); // Max attempts reached

      await validateLinkPassword(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          messageKey: "link.password.rate_limited",
          message: "Too many failed attempts. Please try again later.",
          blockDuration: 900,
        })
      );
    });
  });

  describe("checkPasswordSession", () => {
    it("should pass through if link is not password protected", async () => {
      prismaMock.link.findFirst.mockResolvedValue(null);

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

      prismaMock.link.findFirst.mockResolvedValue(mockLink);
      redisGetMock.mockResolvedValue("valid");

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

      prismaMock.link.findFirst.mockResolvedValue(mockLink);
      redisGetMock.mockResolvedValue(null);

      await checkPasswordSession(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          messageKey: "link.password.session_invalid",
          message: "Invalid or expired password session.",
        })
      );
    });
  });
});
