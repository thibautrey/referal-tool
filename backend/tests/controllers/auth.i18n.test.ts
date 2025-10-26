import type { Request, Response } from "express";
import { DeepMockProxy } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";

import { signup } from "../../src/controllers/auth";
import prisma from "../../src/lib/prisma";
jest.mock("../../src/utils/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

process.env.RESEND = "test-key";

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

type MockResponse = Partial<Response> & {
  status: jest.MockedFunction<Response["status"]>;
  json: jest.MockedFunction<Response["json"]>;
};

const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    status: jest.fn().mockReturnThis() as unknown as Response["status"],
    json: jest.fn(),
  };
  return res;
};

describe("auth controller localization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.create.mockReset();
  });

  it("returns english messaging when accept-language is en", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1 } as any);

    const req = {
      body: {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        password: "password",
      },
      headers: { "accept-language": "en-US,en;q=0.9" },
    } as unknown as Request;
    const res = createMockResponse();

    await signup(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        messageKey: "auth.signup.exists",
        message: "A user with this email already exists.",
      })
    );
  });

  it("returns french messaging when accept-language is fr", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1 } as any);

    const req = {
      body: {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        password: "password",
      },
      headers: { "accept-language": "fr-FR,fr;q=0.8" },
    } as unknown as Request;
    const res = createMockResponse();

    await signup(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        messageKey: "auth.signup.exists",
        message: "Un utilisateur avec cet email existe déjà.",
      })
    );
  });
});
