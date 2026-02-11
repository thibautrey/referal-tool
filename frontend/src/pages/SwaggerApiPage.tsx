import { useEffect } from "react";

/**
 * Swagger UI page for API documentation
 * Displays interactive OpenAPI documentation
 */
export default function SwaggerApiPage() {
  useEffect(() => {
    // Charger Swagger UI depuis CDN
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js";
    script.async = true;
    script.onload = () => {
      // Initialize Swagger UI
      (window as any).SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
        presets: [
          (window as any).SwaggerUIBundle.presets.apis,
          (window as any).SwaggerUIBundle.SwaggerUIStandalonePreset,
        ],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: 1,
      });
    };
    document.body.appendChild(script);

    // Charger CSS Swagger
    const link = document.createElement("link");
    link.href = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div id="swagger-ui"></div>
    </div>
  );
}
