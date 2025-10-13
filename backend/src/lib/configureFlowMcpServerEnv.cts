import fs from "fs";
import path from "path";

const SCRIPT_PATH_CANDIDATES = [
  // Compiled output alongside dist/lib
  path.resolve(__dirname, "../mcp/flowEditorServer.js"),
  path.resolve(__dirname, "../mcp/flowEditorServer.ts"),
  // Source tree fallback when running from backend root
  path.resolve(__dirname, "../../mcp/flowEditorServer.js"),
  path.resolve(__dirname, "../../mcp/flowEditorServer.ts"),
];

/**
 * Resolve the Flow MCP server script path relative to this module.
 * Prefers compiled JavaScript builds but gracefully falls back to
 * the TypeScript source so development environments still work.
 */
export const resolveFlowMcpServerScript = (): string => {
  for (const candidate of SCRIPT_PATH_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return SCRIPT_PATH_CANDIDATES[SCRIPT_PATH_CANDIDATES.length - 1];
};

/**
 * Merge the Flow MCP server script path into the provided environment.
 * Returning a cloned object avoids mutating the parent process env when
 * spawning child processes.
 */
export const configureFlowMcpServerEnv = (
  env: NodeJS.ProcessEnv = process.env
): NodeJS.ProcessEnv => {
  const scriptPath = resolveFlowMcpServerScript();

  return {
    ...env,
    FLOW_MCP_SERVER: scriptPath,
    FLOW_MCP_SERVER_PATH: scriptPath,
  };
};
