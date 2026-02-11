import { Request, Response } from "express";

/**
 * OpenAPI 3.0 Schema for Referral Tool API
 */
export const openApiSchema = {
  openapi: "3.0.0",
  info: {
    title: "Referral Tool API",
    description: "Complete API for managing referral links with advanced targeting and analytics",
    version: "1.0.0",
    contact: {
      name: "Referral Tool Support",
      url: "https://referral-tool.com",
      email: "api-support@referral-tool.com",
    },
  },
  servers: [
    {
      url: "/api",
      description: "Production API",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Link: {
        type: "object",
        required: ["id", "name", "baseUrl", "shortCode"],
        properties: {
          id: {
            type: "integer",
            example: 1,
          },
          name: {
            type: "string",
            example: "My Referral Link",
          },
          baseUrl: {
            type: "string",
            format: "uri",
            example: "https://example.com/signup",
          },
          shortCode: {
            type: "string",
            example: "ref123",
          },
          active: {
            type: "boolean",
            example: true,
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
          rules: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Rule",
            },
          },
        },
      },
      Rule: {
        type: "object",
        required: ["id", "type", "condition", "value"],
        properties: {
          id: {
            type: "integer",
          },
          type: {
            type: "string",
            enum: ["geolocation", "device", "utm"],
            example: "geolocation",
          },
          condition: {
            type: "string",
            example: "country",
          },
          value: {
            type: "string",
            example: "US",
          },
          redirectUrl: {
            type: "string",
            format: "uri",
            example: "https://example.com/us-promo",
          },
        },
      },
      ApiKey: {
        type: "object",
        properties: {
          id: {
            type: "integer",
          },
          name: {
            type: "string",
          },
          key: {
            type: "string",
            description: "API Key (only shown once at creation)",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          primaryAiProvider: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
            },
          },
          primaryAiModel: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              modelIdentifier: { type: "string" },
            },
          },
        },
      },
      LinkStats: {
        type: "object",
        properties: {
          linkId: {
            type: "integer",
          },
          clicks: {
            type: "integer",
            example: 150,
          },
          conversions: {
            type: "integer",
            example: 25,
          },
          conversionRate: {
            type: "number",
            example: 16.67,
          },
          topCountries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                country: { type: "string" },
                clicks: { type: "integer" },
              },
            },
          },
          topDevices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                device: { type: "string" },
                clicks: { type: "integer" },
              },
            },
          },
        },
      },
      ApiResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
          },
          data: {
            type: "object",
          },
          error: {
            type: "string",
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    "/links": {
      post: {
        tags: ["Links"],
        summary: "Create a new link",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "baseUrl", "shortCode"],
                properties: {
                  name: { type: "string" },
                  baseUrl: { type: "string", format: "uri" },
                  shortCode: { type: "string" },
                  active: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Link created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
          400: {
            description: "Bad request",
          },
          401: {
            description: "Unauthorized",
          },
        },
      },
    },
    "/links/{id}": {
      get: {
        tags: ["Links"],
        summary: "Get link by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Link details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Link" },
              },
            },
          },
          404: {
            description: "Link not found",
          },
        },
      },
      put: {
        tags: ["Links"],
        summary: "Update a link",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  baseUrl: { type: "string", format: "uri" },
                  active: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Link updated",
          },
          404: {
            description: "Link not found",
          },
        },
      },
      delete: {
        tags: ["Links"],
        summary: "Delete a link",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Link deleted",
          },
          404: {
            description: "Link not found",
          },
        },
      },
    },
    "/links/{id}/stats": {
      get: {
        tags: ["Links"],
        summary: "Get link statistics",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Link statistics",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LinkStats" },
              },
            },
          },
          404: {
            description: "Link not found",
          },
        },
      },
    },
    "/links/{linkId}/rules": {
      post: {
        tags: ["Rules"],
        summary: "Add a rule to a link",
        parameters: [
          {
            name: "linkId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type", "condition", "value"],
                properties: {
                  type: {
                    type: "string",
                    enum: ["geolocation", "device", "utm"],
                  },
                  condition: { type: "string" },
                  value: { type: "string" },
                  redirectUrl: { type: "string", format: "uri" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Rule created",
          },
          400: {
            description: "Bad request",
          },
        },
      },
    },
    "/links/rules/{ruleId}": {
      put: {
        tags: ["Rules"],
        summary: "Update a rule",
        parameters: [
          {
            name: "ruleId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Rule updated",
          },
        },
      },
      delete: {
        tags: ["Rules"],
        summary: "Delete a rule",
        parameters: [
          {
            name: "ruleId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Rule deleted",
          },
        },
      },
    },
    "/links/check-short-code/{code}": {
      get: {
        tags: ["Links"],
        summary: "Check if short code is available",
        parameters: [
          {
            name: "code",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Availability check result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        available: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const getOpenApiSchema = (_req: Request, res: Response) => {
  res.json(openApiSchema);
};
