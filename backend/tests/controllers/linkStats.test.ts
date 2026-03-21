import { Request, Response } from "express";
import { getLinkStats } from "../../src/controllers/link";
import prisma from "../../src/lib/prisma";
import { createMockResponse } from "../utils/testHelpers";

describe("getLinkStats SQL injection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("sanitizes malicious input", async () => {
    const req = {
      params: { id: "1; DROP TABLE LinkVisit;" },
      query: { countries: "US'); DROP TABLE LinkVisit; --" },
      user: { id: 1, role: "ADMIN" },
    } as unknown as Request;
    const res = createMockResponse() as Response;

    (prisma.link.findFirst as any).mockResolvedValue({ id: 1 });
    (prisma.linkVisit.count as any).mockResolvedValue(0);
    (prisma.linkVisit.groupBy as any).mockResolvedValue([]);
    (prisma.linkRule.findMany as any).mockResolvedValue([]);
    (prisma.$queryRaw as any).mockResolvedValue([]);

    await getLinkStats(req, res);

    expect(prisma.$queryRaw).toHaveBeenCalled();
    const arg = (prisma.$queryRaw as jest.Mock).mock.calls[0][0] as any;
    expect(typeof arg).toBe("object");
    expect(arg.sql).not.toMatch(/DROP TABLE/);
  });
});
