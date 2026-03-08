/**
 * zoh_user_path — "What has the user been reading?"
 *
 * Reconstructs the user's browsing path with engagement signals.
 * Shows what they engaged with and how.
 */

import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "openclaw/plugin-sdk";
import type { ZohGraphClient } from "../client.js";

const ZohUserPathSchema = Type.Object(
  {
    limit: Type.Optional(
      Type.Number({
        description: "Max path entries (1-100). Default: 30.",
        minimum: 1,
        maximum: 100,
      }),
    ),
    since: Type.Optional(
      Type.String({
        description: 'ISO datetime filter, e.g. "2025-01-01T00:00:00Z". Only show entries after this time.',
      }),
    ),
  },
  { additionalProperties: false },
);

export function createZohUserPathTool(client: ZohGraphClient): AnyAgentTool {
  return {
    name: "zoh_user_path",
    label: "Zoh User Path",
    description:
      "See the user's browsing history with engagement signals: dwell time, scroll speed, interactions, and attention scores.",
    parameters: ZohUserPathSchema,
    execute: async (_toolCallId, params) => {
      const result = (await client.userPath(params)) as {
        path: Array<Record<string, unknown>>;
        summary: Record<string, unknown>;
      };

      const summary = result.summary || {};
      const path = result.path || [];

      let text = `User path: ${summary.total_fragments || 0} fragments, ${summary.total_dwell_ms || 0}ms total dwell.\n`;
      text += `Most engaged archetype: ${summary.most_engaged_archetype || "unknown"}\n`;

      const topDomains = (summary.top_domains as Array<Record<string, unknown>>) || [];
      if (topDomains.length > 0) {
        text += `Top domains: ${topDomains.map((d) => `${d.domain} (avg attn: ${d.avg_attention})`).join(", ")}\n`;
      }
      text += "\n";

      for (const entry of path) {
        text += `- [${entry.archetype || "?"}] ${entry.domain || "?"}: ${entry.text_content || "(no text)"}\n`;
        text += `  ID: ${entry.fragment_id}  |  dwell: ${entry.total_dwell_ms}ms  |  views: ${entry.view_count}  |  interaction: ${entry.interaction_type}  |  attention: ${entry.attention_score}\n`;
      }

      return {
        content: [{ type: "text", text }],
        details: result,
      };
    },
  };
}
