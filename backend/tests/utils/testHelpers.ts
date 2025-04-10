import { Request, Response } from "express";
import { mockLinkData, mockUserAgents, mockGeoData } from "../mocks/mockData";
import { getFromCache, getWithCache, saveToCache } from "../../src/lib/redis";
import { getCountryFromIp } from "../../src/utils/geolocation";
import prisma from "../../src/lib/prisma";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

// Define Mock type to avoid using 'jest.Mock' directly
type MockFn = {
  mockResolvedValue: (val: any) => void;
  mockImplementation: (fn: any) => void;
};

// Mock implementations
export const mockRedis = {
  setupCacheHit: (shortCode: string, data = mockLinkData) => {
    const cachedData = {
      data,
      timestamp: Date.now() - 1000, // 1 second ago
    };
    (getFromCache as unknown as MockFn).mockResolvedValue(
      JSON.stringify(cachedData)
    );
    (getWithCache as unknown as MockFn).mockImplementation(
      async (_key: string, fn: Function) => {
        return fn();
      }
    );
  },
  setupCacheMiss: () => {
    (getFromCache as unknown as MockFn).mockResolvedValue(null);
    (getWithCache as unknown as MockFn).mockImplementation(
      async (_key: string, fn: Function) => {
        return fn();
      }
    );
    (saveToCache as unknown as MockFn).mockResolvedValue(undefined);
  },
  setupCacheExpired: (shortCode: string, data = mockLinkData) => {
    const cachedData = {
      data,
      timestamp: Date.now() - 40 * 60 * 1000, // 40 minutes ago (expired)
    };
    (getFromCache as unknown as MockFn).mockResolvedValue(
      JSON.stringify(cachedData)
    );
    (getWithCache as unknown as MockFn).mockImplementation(
      async (_key: string, fn: Function) => {
        return fn();
      }
    );
  },
};

export const mockGeolocation = {
  setup: (countryCode: keyof typeof mockGeoData) => {
    (getCountryFromIp as unknown as MockFn).mockResolvedValue(
      mockGeoData[countryCode]
    );
  },
};

// Define a jest-like function creator
const mockFn = () => {
  const fn = () => {};
  fn.mockResolvedValue = (val: any) => {
    Object.assign(fn, { mockReturnValue: () => val });
    return fn;
  };
  return fn;
};

// Create typed mock functions for Prisma
const createPrismaMock = <T>() => {
  return () => Promise.resolve() as unknown as T;
};

type PrismaLinkFindFirst = PrismaClient["link"]["findFirst"];
type PrismaLinkCreate = PrismaClient["linkVisit"]["create"];

export const mockPrisma = {
  setupFindLink: (data = mockLinkData) => {
    prisma.link.findFirst = createPrismaMock<ReturnType<PrismaLinkFindFirst>>();
    (prisma.link.findFirst as any).mockResolvedValue(data);
  },
  setupLinkNotFound: () => {
    prisma.link.findFirst = createPrismaMock<ReturnType<PrismaLinkFindFirst>>();
    (prisma.link.findFirst as any).mockResolvedValue(null);
  },
  setupCreateVisit: () => {
    prisma.linkVisit.create = createPrismaMock<ReturnType<PrismaLinkCreate>>();
    (prisma.linkVisit.create as any).mockResolvedValue({});
  },
};

// Helper to create mock Express Request object
export const createMockRequest = (options: {
  path?: string;
  ip?: string;
  userAgent?: string;
}): Partial<Request> => {
  const {
    path = "testlink",
    ip = "1.1.1.1",
    userAgent = mockUserAgents.desktop,
  } = options;

  return {
    params: { path },
    ip,
    headers: {
      "user-agent": userAgent,
    },
  };
};

// Helper to create mock Express Response object
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    redirect: mockFn(),
    status: mockFn().mockResolvedValue(null).mockReturnThis(),
    send: mockFn(),
    json: mockFn(),
  };
  return res;
};

// Utility to simulate time passing
export const advanceTime = (ms: number) => {
  const now = Date.now();
  const dateSpy = {
    now: () => now + ms,
  };
  Date.now = dateSpy.now;
};
