# Referral Tool API Documentation

Comprehensive guide to using the Referral Tool API with API Keys.

## Getting Started

### 1. Create an API Key

- Log in to your account
- Go to **Settings → API Keys**
- Click **Create New Key**
- Choose an optional AI Provider & Model for your key
- Copy and save your API key securely (you won't see it again)

### 2. Authentication

All API requests require authentication via API Key in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

## Base URL

```
https://referral-tool.com/api
```

---

## Endpoints

### Links

#### Get Link Details

```http
GET /api/links/:id
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "id": 1,
  "name": "My Referral Link",
  "baseUrl": "https://example.com",
  "shortCode": "abc123",
  "active": true,
  "createdAt": "2025-02-11T10:00:00Z",
  "updatedAt": "2025-02-11T10:00:00Z",
  "rules": [],
  "stats": {
    "clicks": 150,
    "conversions": 25
  }
}
```

#### Create Link

```http
POST /api/links
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "My Referral Link",
  "baseUrl": "https://example.com/signup",
  "shortCode": "my-ref",
  "active": true
}
```

**Response:**
```json
{
  "message": "Link created successfully",
  "data": {
    "id": 1,
    "name": "My Referral Link",
    "baseUrl": "https://example.com/signup",
    "shortCode": "my-ref",
    "active": true,
    "createdAt": "2025-02-11T10:00:00Z"
  }
}
```

#### Update Link

```http
PUT /api/links/:id
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Link Name",
  "baseUrl": "https://example.com/new-path",
  "active": true
}
```

#### Delete Link

```http
DELETE /api/links/:id
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "message": "Link deleted successfully"
}
```

#### Check Short Code Availability

```http
GET /api/links/check-short-code/:code
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "data": {
    "available": true
  }
}
```

#### Get Link Statistics

```http
GET /api/links/:id/stats
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "linkId": 1,
  "clicks": 150,
  "conversions": 25,
  "conversionRate": 16.67,
  "topCountries": [
    { "country": "US", "clicks": 75 },
    { "country": "FR", "clicks": 35 }
  ],
  "topDevices": [
    { "device": "mobile", "clicks": 90 },
    { "device": "desktop", "clicks": 60 }
  ]
}
```

### Link Rules

#### Add Rule to Link

```http
POST /api/links/:linkId/rules
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "geolocation",
  "condition": "country",
  "value": "US",
  "redirectUrl": "https://example.com/us-promo"
}
```

Supported rule types:
- `geolocation` - Redirect based on country/region
- `device` - Redirect based on device type (mobile/desktop)
- `utm` - Redirect based on UTM parameters

#### Update Rule

```http
PUT /api/links/rules/:ruleId
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

#### Delete Rule

```http
DELETE /api/links/rules/:ruleId
Authorization: Bearer YOUR_API_KEY
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid request parameters",
  "error": "Details about the error"
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid or missing API key"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "message": "Internal server error",
  "error": "Error details"
}
```

---

## Code Examples

### JavaScript / Node.js

```javascript
const apiKey = 'your_api_key_here';
const baseUrl = 'https://referral-tool.com/api';

// Create a link
async function createLink(name, baseUrl, shortCode) {
  const response = await fetch(`${baseUrl}/links`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      baseUrl,
      shortCode,
      active: true
    })
  });
  
  return response.json();
}

// Get link stats
async function getLinkStats(linkId) {
  const response = await fetch(`${baseUrl}/links/${linkId}/stats`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });
  
  return response.json();
}

// Usage
createLink('My Link', 'https://example.com', 'ref123')
  .then(data => console.log(data));
```

### Python

```python
import requests

API_KEY = 'your_api_key_here'
BASE_URL = 'https://referral-tool.com/api'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Create a link
def create_link(name, base_url, short_code):
    response = requests.post(
        f'{BASE_URL}/links',
        headers=headers,
        json={
            'name': name,
            'baseUrl': base_url,
            'shortCode': short_code,
            'active': True
        }
    )
    return response.json()

# Get link stats
def get_link_stats(link_id):
    response = requests.get(
        f'{BASE_URL}/links/{link_id}/stats',
        headers=headers
    )
    return response.json()

# Usage
print(create_link('My Link', 'https://example.com', 'ref123'))
```

### cURL

```bash
API_KEY="your_api_key_here"
BASE_URL="https://referral-tool.com/api"

# Create a link
curl -X POST "$BASE_URL/links" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Link",
    "baseUrl": "https://example.com",
    "shortCode": "ref123",
    "active": true
  }'

# Get link stats
curl -X GET "$BASE_URL/links/1/stats" \
  -H "Authorization: Bearer $API_KEY"
```

---

## Rate Limiting

API requests are rate limited to **100 requests per minute** per API key.

Response header includes:
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 95`
- `X-RateLimit-Reset: 1707562000`

---

## Webhooks (Coming Soon)

Subscribe to events:
- `link.created`
- `link.updated`
- `link.deleted`
- `link.clicked`
- `link.converted`

---

## Support

For API support, email: **api-support@referral-tool.com**

Or visit: **https://referral-tool.com/docs**
