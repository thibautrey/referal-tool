import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";

export default function ApiDocsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const codeExamples = {
    curl: `curl -X POST "https://referral-tool.com/api/links" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Referral Link",
    "baseUrl": "https://example.com/signup",
    "shortCode": "ref123",
    "active": true
  }'`,
    javascript: `const response = await fetch('https://referral-tool.com/api/links', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Referral Link',
    baseUrl: 'https://example.com/signup',
    shortCode: 'ref123',
    active: true
  })
});

const data = await response.json();
console.log(data);`,
    python: `import requests

response = requests.post(
    'https://referral-tool.com/api/links',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'name': 'My Referral Link',
        'baseUrl': 'https://example.com/signup',
        'shortCode': 'ref123',
        'active': True
    }
)

data = response.json()
print(data)`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
              <p className="text-slate-300">
                Build integrations with the Referral Tool API
              </p>
            </div>
            <a
              href="/login"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
            >
              Get API Key
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          {[
            { id: "overview", label: "Overview" },
            { id: "endpoints", label: "Endpoints" },
            { id: "examples", label: "Examples" },
            { id: "errors", label: "Errors" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
              <div className="bg-slate-800 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-bold mb-2">1. Create an API Key</h3>
                  <p className="text-slate-300">
                    Log in to your account and go to Settings → API Keys to
                    create a new key.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">2. Authenticate Requests</h3>
                  <p className="text-slate-300">Add to your request headers:</p>
                  <div className="bg-slate-900 rounded p-3 mt-2 font-mono text-sm">
                    Authorization: Bearer YOUR_API_KEY
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-2">3. Start Making Requests</h3>
                  <p className="text-slate-300">
                    Use the endpoints documented below to create, read, update,
                    and delete links.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Base URL</h2>
              <div className="bg-slate-800 rounded-lg p-6 font-mono">
                https://referral-tool.com/api
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Authentication</h2>
              <div className="bg-slate-800 rounded-lg p-6">
                <p className="text-slate-300 mb-4">
                  All API requests require authentication using an API Key.
                  Include it in the Authorization header:
                </p>
                <div className="bg-slate-900 rounded p-4 font-mono text-sm">
                  <div>POST /api/links HTTP/1.1</div>
                  <div>Host: referral-tool.com</div>
                  <div>Authorization: Bearer abc123...xyz</div>
                  <div>Content-Type: application/json</div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Endpoints Tab */}
        {activeTab === "endpoints" && (
          <div className="space-y-8">
            {/* Create Link */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-green-600 text-white px-3 py-1 rounded font-bold text-sm">
                  POST
                </span>
                <code className="text-blue-400 font-mono">/api/links</code>
              </div>
              <p className="text-slate-300 mb-4">Create a new referral link</p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold mb-2">Request Body:</h4>
                  <pre className="bg-slate-900 p-4 rounded text-sm overflow-x-auto">
{`{
  "name": "My Referral Link",
  "baseUrl": "https://example.com/signup",
  "shortCode": "ref123",
  "active": true
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Response:</h4>
                  <pre className="bg-slate-900 p-4 rounded text-sm overflow-x-auto">
{`{
  "message": "Link created successfully",
  "data": {
    "id": 1,
    "name": "My Referral Link",
    "shortCode": "ref123",
    "createdAt": "2025-02-11T10:00:00Z"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Get Link */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-sm">
                  GET
                </span>
                <code className="text-blue-400 font-mono">/api/links/:id</code>
              </div>
              <p className="text-slate-300 mb-4">Retrieve a specific link</p>
            </div>

            {/* Update Link */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-yellow-600 text-white px-3 py-1 rounded font-bold text-sm">
                  PUT
                </span>
                <code className="text-blue-400 font-mono">/api/links/:id</code>
              </div>
              <p className="text-slate-300 mb-4">Update a referral link</p>
            </div>

            {/* Delete Link */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-red-600 text-white px-3 py-1 rounded font-bold text-sm">
                  DELETE
                </span>
                <code className="text-blue-400 font-mono">/api/links/:id</code>
              </div>
              <p className="text-slate-300 mb-4">Delete a referral link</p>
            </div>

            {/* Get Stats */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-sm">
                  GET
                </span>
                <code className="text-blue-400 font-mono">
                  /api/links/:id/stats
                </code>
              </div>
              <p className="text-slate-300 mb-4">Get link click and conversion statistics</p>
            </div>
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === "examples" && (
          <div className="space-y-6">
            {Object.entries(codeExamples).map(([lang, code]) => (
              <div key={lang} className="bg-slate-800 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold capitalize">{lang}</h3>
                  <button
                    onClick={() => copyToClipboard(code, lang)}
                    className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition"
                  >
                    <Copy size={16} />
                    {copied === lang ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="bg-slate-900 p-4 rounded overflow-x-auto text-sm font-mono">
                  {code}
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Errors Tab */}
        {activeTab === "errors" && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Error Responses</h3>
              <div className="space-y-4">
                {[
                  {
                    code: 400,
                    title: "Bad Request",
                    description: "Invalid request parameters",
                  },
                  {
                    code: 401,
                    title: "Unauthorized",
                    description: "Invalid or missing API key",
                  },
                  {
                    code: 404,
                    title: "Not Found",
                    description: "Resource not found",
                  },
                  {
                    code: 429,
                    title: "Rate Limited",
                    description: "Too many requests (100/min limit)",
                  },
                  {
                    code: 500,
                    title: "Server Error",
                    description: "Internal server error",
                  },
                ].map((error) => (
                  <div
                    key={error.code}
                    className="border border-slate-700 rounded p-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-red-600 text-white px-3 py-1 rounded font-bold text-sm">
                        {error.code}
                      </span>
                      <h4 className="font-bold">{error.title}</h4>
                    </div>
                    <p className="text-slate-300 text-sm">{error.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 bg-slate-800/50 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 flex justify-between items-center">
          <p className="text-slate-400">
            © 2025 Referral Tool. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-white transition">
              Support
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition">
              Status
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
