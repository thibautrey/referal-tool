import { ProjectMemberRole, PrismaClient } from "@prisma/client";
import type { Request, Response } from "express";
import { DeepMockProxy } from "jest-mock-extended";

import {
  addProjectMember,
  getProjectMembers,
  getProjects,
  removeProjectMember,
} from "../../src/controllers/project";
import prisma from "../../src/lib/prisma";
import { sendEmail } from "../../src/utils/email";

type MockResponse = Partial<Response> & {
  status: jest.MockedFunction<Response["status"]>;
  json: jest.MockedFunction<Response["json"]>;
  send?: jest.MockedFunction<Response["send"]>;
};

jest.mock("../../src/utils/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    status: jest.fn().mockReturnThis() as unknown as Response["status"],
    json: jest.fn(),
    send: jest.fn(),
  };
  return res;
};

describe("project controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.project.findMany.mockReset();
    prismaMock.user.findUnique.mockReset();
    prismaMock.projectMember.findUnique.mockReset();
    prismaMock.projectMember.create.mockReset();
    prismaMock.project.findUnique.mockReset();
    prismaMock.projectMember.delete.mockReset();
  });

  describe("getProjects", () => {
    it("returns projects owned by or shared with the user", async () => {
      const req = {
        user: { id: 1, role: "USER" },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.project.findMany.mockResolvedValue([
        {
          id: 10,
          name: "Owner Project",
          description: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02"),
          userId: 1,
          members: [],
        } as any,
        {
          id: 20,
          name: "Shared Project",
          description: null,
          createdAt: new Date("2024-02-01"),
          updatedAt: new Date("2024-02-02"),
          userId: 2,
          members: [{ role: ProjectMemberRole.MEMBER }],
        } as any,
      ]);

      await getProjects(req, res as Response);

      expect(prismaMock.project.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ id: 10, role: "OWNER" }),
            expect.objectContaining({ id: 20, role: ProjectMemberRole.MEMBER }),
          ]),
        })
      );
    });
  });

  describe("addProjectMember", () => {
    it("creates a project membership and sends an email", async () => {
      const req = {
        user: { id: 1, email: "owner@example.com", role: "USER" },
        projectAccess: { isOwner: true, isAdmin: false, role: "OWNER" },
        params: { id: "10" },
        body: { email: "member@example.com", role: ProjectMemberRole.ADMIN },
        validatedProjectId: 10,
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        email: "member@example.com",
      } as any);
      prismaMock.project.findUnique.mockResolvedValue({
        id: 10,
        name: "Project 10",
        userId: 1,
        user: { id: 1, email: "owner@example.com" },
      } as any);
      prismaMock.projectMember.findUnique.mockResolvedValue(null);
      const createdMember = {
        id: 55,
        projectId: 10,
        userId: 2,
        role: ProjectMemberRole.ADMIN,
        createdAt: new Date("2024-03-01"),
        user: {
          id: 2,
          email: "member@example.com",
          firstName: "Member",
          lastName: "Example",
        },
      } as any;
      prismaMock.projectMember.create.mockResolvedValue(createdMember);

      await addProjectMember(req, res as Response);

      expect(prismaMock.projectMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            project: { connect: { id: 10 } },
            user: { connect: { id: 2 } },
            role: ProjectMemberRole.ADMIN,
          }),
        })
      );
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "member@example.com",
          subject: expect.stringContaining("Project 10"),
          locale: "en",
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ id: 55, role: ProjectMemberRole.ADMIN }),
        })
      );
    });
  });

  describe("getProjectMembers", () => {
    it("returns owner info and member list", async () => {
      const req = {
        params: { id: "10" },
        validatedProjectId: 10,
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.project.findUnique.mockResolvedValue({
        id: 10,
        name: "Project 10",
        user: {
          id: 1,
          email: "owner@example.com",
          firstName: "Owner",
          lastName: "User",
        },
        members: [
          {
            id: 100,
            role: ProjectMemberRole.MEMBER,
            createdAt: new Date("2024-04-01"),
            user: {
              id: 2,
              email: "member@example.com",
              firstName: "Member",
              lastName: "User",
            },
          },
        ],
      } as any);

      await getProjectMembers(req, res as Response);

      expect(prismaMock.project.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 10 } })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            owner: expect.objectContaining({ email: "owner@example.com" }),
            members: expect.arrayContaining([
              expect.objectContaining({ role: ProjectMemberRole.MEMBER }),
            ]),
          },
        })
      );
    });
  });

  describe("removeProjectMember", () => {
    it("prevents removing another member without permissions", async () => {
      const req = {
        params: { id: "10", memberId: "200" },
        validatedProjectId: 10,
        user: { id: 3, role: "USER" },
        projectAccess: { isOwner: false, isAdmin: false, role: "MEMBER" },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.projectMember.findUnique.mockResolvedValue({
        id: 200,
        projectId: 10,
        userId: 2,
      } as any);

      await removeProjectMember(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(prismaMock.projectMember.delete).not.toHaveBeenCalled();
    });
  });
});
