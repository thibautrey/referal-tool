#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Configuration
const API_BASE_URL = process.env.RFLNK_API_URL || "http://localhost:3000/api";
const API_KEY = process.env.RFLNK_API_KEY;

if (!API_KEY) {
  console.error(
    "Error: RFLNK_API_KEY environment variable is required.\n" +
    "Please set it to your rflnk API key.\n" +
    "You can create an API key in your rflnk dashboard: Settings → API Keys"
  );
  process.exit(1);
}

// Helper function for API requests
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      if (errorText) errorMessage += ` - ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  return null;
}

// Tool definitions
const TOOLS: Tool[] = [
  {
    name: "list_links",
    description: "Get a list of all your referral/affiliate links",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Optional project ID to filter links by project",
        },
        page: {
          type: "number",
          description: "Page number for pagination (default: 1)",
        },
        limit: {
          type: "number",
          description: "Number of links per page (default: 10)",
        },
      },
    },
  },
  {
    name: "get_link",
    description: "Get detailed information about a specific link by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The ID of the link to retrieve",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_link",
    description: "Create a new referral/affiliate link",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "The project ID to create the link in",
        },
        name: {
          type: "string",
          description: "A descriptive name for the link",
        },
        baseUrl: {
          type: "string",
          description: "The destination URL where users will be redirected",
        },
        shortCode: {
          type: "string",
          description: "Optional custom short code. If not provided, a random code will be generated",
        },
        active: {
          type: "boolean",
          description: "Whether the link is active (default: true)",
        },
        isPasswordProtected: {
          type: "boolean",
          description: "Whether to require a password to access the link",
        },
        password: {
          type: "string",
          description: "Password for the link (required if isPasswordProtected is true)",
        },
        utmSource: {
          type: "string",
          description: "UTM source parameter",
        },
        utmMedium: {
          type: "string",
          description: "UTM medium parameter",
        },
        utmCampaign: {
          type: "string",
          description: "UTM campaign parameter",
        },
        utmTerm: {
          type: "string",
          description: "UTM term parameter",
        },
        utmContent: {
          type: "string",
          description: "UTM content parameter",
        },
        expiresAt: {
          type: "string",
          description: "Expiration date in ISO format (e.g., '2025-12-31T23:59:59Z')",
        },
      },
      required: ["projectId", "name", "baseUrl"],
    },
  },
  {
    name: "update_link",
    description: "Update an existing referral/affiliate link",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The ID of the link to update",
        },
        name: {
          type: "string",
          description: "New name for the link",
        },
        baseUrl: {
          type: "string",
          description: "New destination URL",
        },
        active: {
          type: "boolean",
          description: "Whether the link is active",
        },
        isPasswordProtected: {
          type: "boolean",
          description: "Enable or disable password protection",
        },
        password: {
          type: "string",
          description: "New password for the link",
        },
        removePassword: {
          type: "boolean",
          description: "Remove password protection entirely",
        },
        utmSource: {
          type: "string",
          description: "UTM source parameter",
        },
        utmMedium: {
          type: "string",
          description: "UTM medium parameter",
        },
        utmCampaign: {
          type: "string",
          description: "UTM campaign parameter",
        },
        utmTerm: {
          type: "string",
          description: "UTM term parameter",
        },
        utmContent: {
          type: "string",
          description: "UTM content parameter",
        },
        expiresAt: {
          type: "string",
          description: "New expiration date in ISO format, or null to remove expiration",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_link",
    description: "Delete a referral/affiliate link permanently",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The ID of the link to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "check_short_code",
    description: "Check if a short code is available for use",
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "The short code to check",
        },
      },
      required: ["code"],
    },
  },
  {
    name: "get_link_stats",
    description: "Get statistics for a specific link (clicks, countries, devices)",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The ID of the link",
        },
        timeRange: {
          type: "string",
          enum: ["day", "week", "month", "year"],
          description: "Time range for statistics (default: week)",
        },
        startDate: {
          type: "string",
          description: "Start date in ISO format for custom range",
        },
        endDate: {
          type: "string",
          description: "End date in ISO format for custom range",
        },
        countries: {
          type: "string",
          description: "Comma-separated list of country codes to filter by",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "add_geo_rule",
    description: "Add a geolocation-based redirect rule to a link",
    inputSchema: {
      type: "object",
      properties: {
        linkId: {
          type: "number",
          description: "The ID of the link to add the rule to",
        },
        countries: {
          type: "array",
          items: { type: "string" },
          description: "Array of country codes (e.g., ['US', 'FR', 'DE'])",
        },
        redirectUrl: {
          type: "string",
          description: "The URL to redirect to for users from these countries",
        },
      },
      required: ["linkId", "countries", "redirectUrl"],
    },
  },
  {
    name: "update_geo_rule",
    description: "Update an existing geolocation rule",
    inputSchema: {
      type: "object",
      properties: {
        ruleId: {
          type: "number",
          description: "The ID of the rule to update",
        },
        countries: {
          type: "array",
          items: { type: "string" },
          description: "Array of country codes",
        },
        redirectUrl: {
          type: "string",
          description: "The new redirect URL",
        },
      },
      required: ["ruleId"],
    },
  },
  {
    name: "delete_geo_rule",
    description: "Delete a geolocation rule",
    inputSchema: {
      type: "object",
      properties: {
        ruleId: {
          type: "number",
          description: "The ID of the rule to delete",
        },
      },
      required: ["ruleId"],
    },
  },
  {
    name: "add_device_rule",
    description: "Add a device-based redirect rule to a link",
    inputSchema: {
      type: "object",
      properties: {
        linkId: {
          type: "number",
          description: "The ID of the link to add the rule to",
        },
        deviceType: {
          type: "string",
          enum: ["mobile", "desktop", "tablet", "all"],
          description: "The type of device to match",
        },
        devices: {
          type: "array",
          items: { type: "string" },
          description: "Array of specific device identifiers",
        },
        redirectUrl: {
          type: "string",
          description: "The URL to redirect to for matching devices",
        },
      },
      required: ["linkId", "deviceType", "redirectUrl"],
    },
  },
  {
    name: "update_device_rule",
    description: "Update an existing device rule",
    inputSchema: {
      type: "object",
      properties: {
        ruleId: {
          type: "number",
          description: "The ID of the device rule to update",
        },
        deviceType: {
          type: "string",
          enum: ["mobile", "desktop", "tablet", "all"],
          description: "The device type",
        },
        devices: {
          type: "array",
          items: { type: "string" },
          description: "Array of device identifiers",
        },
        redirectUrl: {
          type: "string",
          description: "The new redirect URL",
        },
      },
      required: ["ruleId"],
    },
  },
  {
    name: "delete_device_rule",
    description: "Delete a device rule",
    inputSchema: {
      type: "object",
      properties: {
        ruleId: {
          type: "number",
          description: "The ID of the device rule to delete",
        },
      },
      required: ["ruleId"],
    },
  },
];

// Input validation schemas
const ListLinksSchema = z.object({
  projectId: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

const GetLinkSchema = z.object({
  id: z.number(),
});

const CreateLinkSchema = z.object({
  projectId: z.string(),
  name: z.string(),
  baseUrl: z.string(),
  shortCode: z.string().optional(),
  active: z.boolean().optional(),
  isPasswordProtected: z.boolean().optional(),
  password: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  expiresAt: z.string().optional(),
});

const UpdateLinkSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  baseUrl: z.string().optional(),
  active: z.boolean().optional(),
  isPasswordProtected: z.boolean().optional(),
  password: z.string().optional(),
  removePassword: z.boolean().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  expiresAt: z.string().optional().nullable(),
});

const DeleteLinkSchema = z.object({
  id: z.number(),
});

const CheckShortCodeSchema = z.object({
  code: z.string(),
});

const GetLinkStatsSchema = z.object({
  id: z.number(),
  timeRange: z.enum(["day", "week", "month", "year"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  countries: z.string().optional(),
});

const AddGeoRuleSchema = z.object({
  linkId: z.number(),
  countries: z.array(z.string()),
  redirectUrl: z.string(),
});

const UpdateGeoRuleSchema = z.object({
  ruleId: z.number(),
  countries: z.array(z.string()).optional(),
  redirectUrl: z.string().optional(),
});

const DeleteGeoRuleSchema = z.object({
  ruleId: z.number(),
});

const AddDeviceRuleSchema = z.object({
  linkId: z.number(),
  deviceType: z.enum(["mobile", "desktop", "tablet", "all"]),
  devices: z.array(z.string()).optional(),
  redirectUrl: z.string(),
});

const UpdateDeviceRuleSchema = z.object({
  ruleId: z.number(),
  deviceType: z.enum(["mobile", "desktop", "tablet", "all"]).optional(),
  devices: z.array(z.string()).optional(),
  redirectUrl: z.string().optional(),
});

const DeleteDeviceRuleSchema = z.object({
  ruleId: z.number(),
});

// Tool handlers
async function handleListLinks(args: unknown) {
  const { projectId, page, limit } = ListLinksSchema.parse(args);

  if (projectId) {
    const queryParams = new URLSearchParams();
    if (page) queryParams.set("page", page.toString());
    if (limit) queryParams.set("limit", limit.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const response = await apiRequest(`/links/project/${projectId}${query}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  } else {
    const response = await apiRequest("/links");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }
}

async function handleGetLink(args: unknown) {
  const { id } = GetLinkSchema.parse(args);
  const response = await apiRequest(`/links/${id}`);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(response, null, 2),
      },
    ],
  };
}

async function handleCreateLink(args: unknown) {
  const data = CreateLinkSchema.parse(args);
  const { projectId, ...linkData } = data;
  
  const response = await apiRequest(`/links`, {
    method: "POST",
    body: JSON.stringify(linkData),
    headers: {
      "X-Project-Id": projectId,
    },
  });
  return {
    content: [
      {
        type: "text",
        text: `Link created successfully!\n\n${JSON.stringify(response, null, 2)}`,
      },
    ],
  };
}

async function handleUpdateLink(args: unknown) {
  const { id, ...data } = UpdateLinkSchema.parse(args);
  const response = await apiRequest(`/links/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return {
    content: [
      {
        type: "text",
        text: `Link updated successfully!\n\n${JSON.stringify(response, null, 2)}`,
      },
    ],
  };
}

async function handleDeleteLink(args: unknown) {
  const { id } = DeleteLinkSchema.parse(args);
  await apiRequest(`/links/${id}`, {
    method: "DELETE",
  });
  return {
    content: [
      {
        type: "text",
        text: `Link ${id} has been deleted successfully.`,
      },
    ],
  };
}

async function handleCheckShortCode(args: unknown) {
  const { code } = CheckShortCodeSchema.parse(args);
  const response = await apiRequest(`/links/check-short-code/${code}`);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(response, null, 2),
      },
    ],
  };
}

async function handleGetLinkStats(args: unknown) {
  const { id, ...params } = GetLinkStatsSchema.parse(args);
  const queryParams = new URLSearchParams();
  
  if (params.timeRange) queryParams.set("timeRange", params.timeRange);
  if (params.startDate) queryParams.set("startDate", params.startDate);
  if (params.endDate) queryParams.set("endDate", params.endDate);
  if (params.countries) queryParams.set("countries", params.countries);
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const response = await apiRequest(`/links/${id}/stats${query}`);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(response, null, 2),
      },
    ],
  };
}

async function handleAddGeoRule(args: unknown) {
  const { linkId, countries, redirectUrl } = AddGeoRuleSchema.parse(args);
  const response = await apiRequest(`/links/${linkId}/rules`, {
    method: "POST",
    body: JSON.stringify({
      redirectUrl,
      countries,
    }),
  });
  return {
    content: [
      {
        type: "text",
        text: `Geo rule added successfully!\n\n${JSON.stringify(response, null, 2)}`,
      },
    ],
  };
}

async function handleUpdateGeoRule(args: unknown) {
  const { ruleId, ...data } = UpdateGeoRuleSchema.parse(args);
  const response = await apiRequest(`/links/rules/${ruleId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return {
    content: [
      {
        type: "text",
        text: `Geo rule updated successfully!\n\n${JSON.stringify(response, null, 2)}`,
      },
    ],
  };
}

async function handleDeleteGeoRule(args: unknown) {
  const { ruleId } = DeleteGeoRuleSchema.parse(args);
  await apiRequest(`/links/rules/${ruleId}`, {
    method: "DELETE",
  });
  return {
    content: [
      {
        type: "text",
        text: `Geo rule ${ruleId} has been deleted successfully.`,
      },
    ],
  };
}

async function handleAddDeviceRule(args: unknown) {
  const { linkId, deviceType, devices, redirectUrl } = AddDeviceRuleSchema.parse(args);
  // Note: Device rules might be handled differently in the API
  // This is based on the link controller which handles device rules during create/update
  const response = await apiRequest(`/links/${linkId}`, {
    method: "GET",
  });
  
  // Get current link and add device rule
  const linkData = response?.data;
  if (!linkData) {
    throw new Error("Link not found");
  }
  
  const existingDeviceRules = linkData.deviceRules || [];
  const updatedDeviceRules = [...existingDeviceRules, {
    deviceType,
    devices: devices || [],
    redirectUrl,
  }];
  
  const updateResponse = await apiRequest(`/links/${linkId}`, {
    method: "PUT",
    body: JSON.stringify({
      deviceRules: updatedDeviceRules,
    }),
  });
  
  return {
    content: [
      {
        type: "text",
        text: `Device rule added successfully!\n\n${JSON.stringify(updateResponse, null, 2)}`,
      },
    ],
  };
}

async function handleUpdateDeviceRule(args: unknown) {
  const { ruleId, ...data } = UpdateDeviceRuleSchema.parse(args);
  // Device rules are updated via the link update endpoint
  // This is a simplified implementation
  return {
    content: [
      {
        type: "text",
        text: `To update a device rule, use the update_link tool with the deviceRules array containing all rules for the link.`,
      },
    ],
  };
}

async function handleDeleteDeviceRule(args: unknown) {
  const { ruleId } = DeleteDeviceRuleSchema.parse(args);
  // Device rules are deleted via the link update endpoint
  // This is a simplified implementation
  return {
    content: [
      {
        type: "text",
        text: `To delete a device rule, use the update_link tool with the deviceRules array excluding the rule you want to remove.`,
      },
    ],
  };
}

// Server setup
const server = new Server(
  {
    name: "rflnk-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_links":
        return await handleListLinks(args);
      case "get_link":
        return await handleGetLink(args);
      case "create_link":
        return await handleCreateLink(args);
      case "update_link":
        return await handleUpdateLink(args);
      case "delete_link":
        return await handleDeleteLink(args);
      case "check_short_code":
        return await handleCheckShortCode(args);
      case "get_link_stats":
        return await handleGetLinkStats(args);
      case "add_geo_rule":
        return await handleAddGeoRule(args);
      case "update_geo_rule":
        return await handleUpdateGeoRule(args);
      case "delete_geo_rule":
        return await handleDeleteGeoRule(args);
      case "add_device_rule":
        return await handleAddDeviceRule(args);
      case "update_device_rule":
        return await handleUpdateDeviceRule(args);
      case "delete_device_rule":
        return await handleDeleteDeviceRule(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("rflnk MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
