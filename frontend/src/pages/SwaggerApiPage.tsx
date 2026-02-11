import { useState, useEffect } from "react";

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths: Record<string, any>;
  components: Record<string, any>;
}

export default function SwaggerApiPage() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/openapi.json");
        if (!response.ok) {
          throw new Error(`Failed to fetch OpenAPI spec: ${response.status}`);
        }
        const data = await response.json();
        setSpec(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load API documentation");
        console.error("Error loading OpenAPI spec:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpec();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            Make sure the backend is running on port 3001
          </p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No API documentation available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{spec.info.title}</h1>
          <p className="text-gray-600">API Version: {spec.info.version}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Endpoints</h2>
          
          {Object.entries(spec.paths).map(([path, methods]) => (
            <div key={path} className="mb-8 pb-8 border-b">
              <h3 className="text-xl font-mono font-bold text-gray-700 mb-4">{path}</h3>
              
              {Object.entries(methods).map(([method, details]: [string, any]) => {
                const methodColor = {
                  get: "bg-blue-100 text-blue-800",
                  post: "bg-green-100 text-green-800",
                  put: "bg-yellow-100 text-yellow-800",
                  delete: "bg-red-100 text-red-800",
                  patch: "bg-purple-100 text-purple-800",
                }[method.toLowerCase()] || "bg-gray-100 text-gray-800";

                return (
                  <div key={`${path}-${method}`} className="mb-4 ml-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded font-bold text-sm ${methodColor}`}>
                        {method.toUpperCase()}
                      </span>
                      <span className="text-gray-700">{details.summary}</span>
                    </div>
                    
                    {details.description && (
                      <p className="text-gray-600 text-sm ml-16 mb-2">{details.description}</p>
                    )}

                    {details.parameters && details.parameters.length > 0 && (
                      <div className="ml-16 mb-2">
                        <p className="font-semibold text-sm text-gray-700">Parameters:</p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {details.parameters.map((param: any, idx: number) => (
                            <li key={idx}>
                              {param.name} ({param.in}) {param.required ? "- Required" : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {details.responses && (
                      <div className="ml-16">
                        <p className="font-semibold text-sm text-gray-700">Responses:</p>
                        <div className="text-sm text-gray-600">
                          {Object.entries(details.responses).map(([code, response]: [string, any]) => (
                            <div key={code} className="ml-4">
                              <span className="font-mono font-bold">{code}</span>: {response.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">Authentication</h3>
          <p className="text-blue-800 text-sm">
            All API endpoints require a Bearer token. Include it in the Authorization header:
          </p>
          <code className="block bg-blue-100 p-3 rounded mt-2 text-sm font-mono">
            Authorization: Bearer YOUR_API_KEY
          </code>
        </div>
      </div>
    </div>
  );
}
