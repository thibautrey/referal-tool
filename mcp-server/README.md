# rflnk MCP Server

A Model Context Protocol (MCP) server for managing referral and affiliate links through the rflnk API.

## Overview

This MCP server allows AI assistants like Claude to interact with your rflnk account to create, update, delete, and manage referral/affiliate links programmatically.

## Prerequisites

- Node.js 18 or higher
- An rflnk account with API access
- An API key from your rflnk dashboard

## Installation

### 1. Install dependencies

```bash
cd mcp-server
npm install
```

### 2. Build the server

```bash
npm run build
```

### 3. Configure environment variables

Set the `RFLNK_API_KEY` environment variable with your API key:

```bash
export RFLNK_API_KEY="your_api_key_here"
```

You can also optionally set the API base URL:

```bash
export RFLNK_API_URL="https://your-domain.com/api"  # defaults to http://localhost:3000/api
```

## Getting an API Key

1. Log in to your rflnk dashboard
2. Go to **Settings → API Keys**
3. Click **Create New Key**
4. Copy and save your API key securely (you won't see it again)

## Configuration with Claude Desktop

Add this server to your Claude Desktop configuration:

### macOS

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rflnk": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "RFLNK_API_KEY": "your_api_key_here",
        "RFLNK_API_URL": "https://your-domain.com/api"
      }
    }
  }
}
```

### Windows

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rflnk": {
      "command": "node",
      "args": ["C:\\path\\to\\mcp-server\\dist\\index.js"],
      "env": {
        "RFLNK_API_KEY": "your_api_key_here",
        "RFLNK_API_URL": "https://your-domain.com/api"
      }
    }
  }
}
```

## Available Tools

### Link Management

#### `list_links`
Get a list of all your referral/affiliate links.

**Parameters:**
- `projectId` (optional): Filter by project ID
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page

#### `get_link`
Get detailed information about a specific link.

**Parameters:**
- `id` (required): The link ID

#### `create_link`
Create a new referral/affiliate link.

**Parameters:**
- `projectId` (required): Project to create the link in
- `name` (required): Link name
- `baseUrl` (required): Destination URL
- `shortCode` (optional): Custom short code
- `active` (optional): Whether the link is active (default: true)
- `isPasswordProtected` (optional): Enable password protection
- `password` (optional): Password (required if password protection enabled)
- `utmSource`, `utmMedium`, `utmCampaign`, `utmTerm`, `utmContent` (optional): UTM parameters
- `expiresAt` (optional): Expiration date in ISO format

#### `update_link`
Update an existing link.

**Parameters:**
- `id` (required): Link ID
- All create_link fields are optional
- `removePassword` (optional): Remove password protection

#### `delete_link`
Delete a link permanently.

**Parameters:**
- `id` (required): Link ID

#### `check_short_code`
Check if a short code is available.

**Parameters:**
- `code` (required): Short code to check

#### `get_link_stats`
Get statistics for a link.

**Parameters:**
- `id` (required): Link ID
- `timeRange` (optional): "day", "week", "month", or "year"
- `startDate`, `endDate` (optional): Custom date range
- `countries` (optional): Comma-separated country codes

### Geo Rules (Geolocation Redirects)

#### `add_geo_rule`
Add a geolocation-based redirect rule.

**Parameters:**
- `linkId` (required): Link ID
- `countries` (required): Array of country codes (e.g., ["US", "FR"])
- `redirectUrl` (required): Redirect URL for these countries

#### `update_geo_rule`
Update a geolocation rule.

**Parameters:**
- `ruleId` (required): Rule ID
- `countries` (optional): New country list
- `redirectUrl` (optional): New redirect URL

#### `delete_geo_rule`
Delete a geolocation rule.

**Parameters:**
- `ruleId` (required): Rule ID

### Device Rules

#### `add_device_rule`
Add a device-based redirect rule.

**Parameters:**
- `linkId` (required): Link ID
- `deviceType` (required): "mobile", "desktop", "tablet", or "all"
- `devices` (optional): Array of specific device identifiers
- `redirectUrl` (required): Redirect URL

## Example Usage

With Claude Desktop, you can ask things like:

- "Show me all my referral links"
- "Create a new link called 'Summer Promo' that goes to https://example.com/summer"
- "Check if the short code 'sale2024' is available"
- "Get statistics for link ID 123"
- "Add a geo rule to link 123 to redirect US visitors to https://example.com/us"
- "Delete link 456"

## Development

```bash
# Run in development mode
npm run dev

# Build
npm run build

# Run production build
npm start
```

## API Documentation

For more details about the rflnk API, see the [API Documentation](/docs/api) in your rflnk dashboard.

## License

MIT
