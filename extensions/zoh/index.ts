/**
 * Zoh Plugin for OpenClaw
 *
 * Provides 5 graph-probing tools for LLM agents to navigate
 * the Zoh knowledge graph, driven by user engagement signals.
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { resolveZohConfig } from "./src/config.js";
import { ZohGraphClient } from "./src/client.js";
import { ZOH_AGENT_GUIDANCE } from "./src/prompt-guidance.js";
import { createZohProbeTool } from "./src/tools/zoh-probe.js";
import { createZohSimilarTool } from "./src/tools/zoh-similar.js";
import { createZohConnectionsTool } from "./src/tools/zoh-connections.js";
import { createZohUserPathTool } from "./src/tools/zoh-user-path.js";
import { createZohRecommendTool } from "./src/tools/zoh-recommend.js";

const ZOH_CONFIG_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    baseUrl: {
      type: "string",
      description: "Base URL of the Zoh backend API",
      default: "http://localhost:5001",
    },
    timeoutMs: {
      type: "number",
      description: "Request timeout in milliseconds",
      default: 15000,
      minimum: 1000,
      maximum: 60000,
    },
  },
} as const;

const plugin = {
  id: "zoh",
  name: "Zoh",
  description: "Knowledge graph probing tools for navigating web fragments ranked by engagement.",
  configSchema: {
    safeParse(value: unknown) {
      if (value === undefined) {
        return { success: true as const, data: undefined };
      }
      try {
        return { success: true as const, data: resolveZohConfig(value) };
      } catch (error) {
        return {
          success: false as const,
          error: {
            issues: [
              {
                path: [],
                message: error instanceof Error ? error.message : String(error),
              },
            ],
          },
        };
      }
    },
    jsonSchema: ZOH_CONFIG_JSON_SCHEMA,
  },
  register(api: OpenClawPluginApi) {
    const config = resolveZohConfig(api.pluginConfig);
    const client = new ZohGraphClient(config);

    api.registerTool(createZohProbeTool(client));
    api.registerTool(createZohSimilarTool(client));
    api.registerTool(createZohConnectionsTool(client));
    api.registerTool(createZohUserPathTool(client));
    api.registerTool(createZohRecommendTool(client));

    api.on("before_prompt_build", async () => ({
      prependContext: ZOH_AGENT_GUIDANCE,
    }));
  },
};

export default plugin;
