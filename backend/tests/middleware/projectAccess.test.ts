import { PrismaClient } from "@prisma/client";
import type { Request, Response, NextFunction } from "express";
import { DeepMockProxy } from "jest-mock-extended";

import prisma from "../../src/lib/prisma";
import { validateProjectAccess } from "../../src/middleware/projectAccess";

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

describe("validateProjectAccess", () => {
  let next: jest.MockedFunction<NextFunction>;
  let res: Response;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.project.findUnique.mockReset();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
  });

  it("allows access when user owns the project", async () => {
    const req = {
      params: { id: "10" },
      user: { id: 1, role: "USER" },
    } as unknown as Request;

    prismaMock.project.findUnique.mockResolvedValue({
      id: 10,
      userId: 1,
      members: [],
    });

    await validateProjectAccess(req, res, next);

    expect(req.validatedProjectId).toBe(10);
    expect(req.projectAccess).toEqual(
      expect.objectContaining({ role: "OWNER", isOwner: true })
    );
    expect(next).toHaveBeenCalled();
  });

  it("allows access when user is a project member", async () => {
    const req = {
      params: { id: "20" },
      user: { id: 5, role: "USER" },
    } as unknown as Request;

    prismaMock.project.findUnique.mockResolvedValue({
      id: 20,
      userId: 2,
      members: [{ id: 99, userId: 5, role: "MEMBER" }],
    });

    await validateProjectAccess(req, res, next);

    expect(req.validatedProjectId).toBe(20);
    expect(req.projectAccess).toEqual(
      expect.objectContaining({ role: "MEMBER", membershipId: 99 })
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns 403 when user lacks access", async () => {
    const req = {
      params: { id: "30" },
      user: { id: 3, role: "USER" },
    } as unknown as Request;

    prismaMock.project.findUnique.mockResolvedValue({
      id: 30,
      userId: 1,
      members: [],
    });

    await validateProjectAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
    expect(req.validatedProjectId).toBeUndefined();
  });
});
