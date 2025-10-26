import { Request, Response } from "express";
import {
  handleRedirection,
  getUserAgent,
} from "../../src/services/redirection";
import {
  mockRedis,
  mockGeolocation,
  mockPrisma,
  createMockRequest,
  createMockResponse,
  advanceTime,
} from "../utils/testHelpers";
import { mockLinkData, mockUserAgents } from "../mocks/mockData";

describe("Redirection Service Tests", () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockRestore();
  });

  describe("getUserAgent", () => {
    test("detects desktop device", () => {
      const req = {
        headers: { "user-agent": mockUserAgents.desktop },
      } as Request;
      expect(getUserAgent(req)).toEqual({
        deviceType: "desktop",
        userAgent: mockUserAgents.desktop,
      });
    });

    test("detects mobile device", () => {
      const req = {
        headers: { "user-agent": mockUserAgents.mobile },
      } as Request;
      expect(getUserAgent(req)).toEqual({
        deviceType: "mobile",
        userAgent: mockUserAgents.mobile,
      });
    });

    test("detects tablet device", () => {
      const req = {
        headers: { "user-agent": mockUserAgents.tablet },
      } as Request;
      expect(getUserAgent(req)).toEqual({
        deviceType: "tablet",
        userAgent: mockUserAgents.tablet,
      });
    });
  });

  describe("handleRedirection", () => {
    test("redirects based on cache hit", async () => {
      const req = createMockRequest({
        userAgent: mockUserAgents.mobile,
      }) as Request;
      const res = createMockResponse() as Response;

      mockRedis.setupCacheHit("testlink");
      mockGeolocation.setup("US");
      mockPrisma.setupFindLink();
      mockPrisma.setupCreateVisit();

      await handleRedirection(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        "https://example-mobile.com"
      );
    });

    test("redirects based on device rule priority", async () => {
      const req = createMockRequest({
        userAgent: mockUserAgents.mobile,
      }) as Request;
      const res = createMockResponse() as Response;

      mockRedis.setupCacheHit("testlink");
      mockGeolocation.setup("US");
      mockPrisma.setupFindLink();
      mockPrisma.setupCreateVisit();

      await handleRedirection(req, res);

      // Device rules should take priority over geo rules
      expect(res.redirect).toHaveBeenCalledWith(
        302,
        "https://example-mobile.com"
      );
    });

    test("redirects based on geo rule when no device rule matches", async () => {
      const customLinkData = JSON.parse(JSON.stringify(mockLinkData));
      // Remove the mobile device rule
      customLinkData.deviceRules = customLinkData.deviceRules.filter(
        (rule: any) => rule.deviceType !== "mobile"
      );

      const req = createMockRequest({
        userAgent: mockUserAgents.mobile,
      }) as Request;
      const res = createMockResponse() as Response;

      mockRedis.setupCacheHit("testlink", customLinkData);
      mockGeolocation.setup("FR");
      mockPrisma.setupFindLink(customLinkData);
      mockPrisma.setupCreateVisit();

      await handleRedirection(req, res);

      // Should use geo rule for France
      expect(res.redirect).toHaveBeenCalledWith(302, "https://example-eu.com");
    });

    test("handles cache miss by fetching from database", async () => {
      const req = createMockRequest({}) as Request;
      const res = createMockResponse() as Response;

      mockRedis.setupCacheMiss();
      mockGeolocation.setup("US");
      mockPrisma.setupFindLink();
      mockPrisma.setupCreateVisit();

      await handleRedirection(req, res);

      expect(res.redirect).toHaveBeenCalled();
    });

    test("handles expired cache by refreshing data", async () => {
      const req = createMockRequest({}) as Request;
      const res = createMockResponse() as Response;

      mockRedis.setupCacheExpired("testlink");
      mockGeolocation.setup("US");
      mockPrisma.setupFindLink();
      mockPrisma.setupCreateVisit();

      await handleRedirection(req, res);

      expect(res.redirect).toHaveBeenCalled();
    });

    test("returns 404 for non-existent link", async () => {
      const req = createMockRequest({ path: "nonexistent" }) as Request;
      const res = createMockResponse() as Response;

      mockRedis.setupCacheMiss();
      mockGeolocation.setup("US");
      mockPrisma.setupLinkNotFound(); // Use new helper method specifically for non-existent links

      await handleRedirection(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("returns 410 when the link has expired", async () => {
      const expiredLinkData = {
        ...mockLinkData,
        expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
      };

      const req = createMockRequest({}) as Request;
      const res = createMockResponse() as Response;

      mockRedis.setupCacheHit("testlink", expiredLinkData);
      mockGeolocation.setup("US");
      mockPrisma.setupFindLink(expiredLinkData);

      await handleRedirection(req, res);

      expect(res.status).toHaveBeenCalledWith(410);
      expect(res.redirect).not.toHaveBeenCalled();
    });

    test("uses baseUrl when no rules match", async () => {
      const req = createMockRequest({}) as Request;
      const res = createMockResponse() as Response;

      const customLinkData = JSON.parse(JSON.stringify(mockLinkData));
      // Remove all device rules and use a country that doesn't match any geo rule
      customLinkData.deviceRules = [];

      mockRedis.setupCacheHit("testlink", customLinkData);
      mockGeolocation.setup("JP");
      mockPrisma.setupFindLink(customLinkData);
      mockPrisma.setupCreateVisit();

      await handleRedirection(req, res);

      // Should fall back to base URL
      expect(res.redirect).toHaveBeenCalledWith(302, "https://example.com");
    });
  });
});
