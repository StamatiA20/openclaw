/**
 * zoh_probe — "What content exists about X?"
 *
 * Probes the knowledge graph by archetype, text query, or domain.
 * All results ranked by engagement.
 */

import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "openclaw/plugin-sdk";
import type { ZohGraphClient } from "../client.js";

const ZohProbeSchema = Type.Object(
  {
    archetype: Type.Optional(
      Type.String({
        description:
          'Fragment archetype to filter by, e.g. "article", "product_card", "video_card", "comment".',
      }),
    ),
    query: Type.Optional(
      Type.String({
        description: "Text search across fragment content.",
      }),
    ),
    domain: Type.Optional(
      Type.String({
        description: 'Filter by source domain, e.g. "nytimes.com".',
      }),
    ),
    min_engagement: Type.Optional(
      Type.Number({
        description: "Minimum attention score threshold (0.0+). Default: 0.",
        minimum: 0,
      }),
    ),
    limit: Type.Optional(
      Type.Number({
        description: "Max results to return (1-50). Default: 10.",
        minimum: 1,
        maximum: 50,
      }),
    ),
  },
  { additionalProperties: false },
);

export function createZohProbeTool(client: ZohGraphClient): AnyAgentTool {
  return {
    name: "zoh_probe",
    label: "Zoh Probe",
    description:
      "Search the Zoh knowledge graph by content type, topic, or domain. Results are ranked by user engagement.",
    parameters: ZohProbeSchema,
    execute: async (_toolCallId, params) => {
      const result = (await client.probe(params)) as {
        fragments: Array<Record<string, unknown>>;
        total_matching: number;
      };

      const count = result.fragments?.length ?? 0;
      const total = result.total_matching ?? 0;

      let text = `Found ${total} matching fragments (showing ${count}).\n\n`;
      if (result.fragments) {
        for (const f of result.fragments) {
          const eng = f.engagement as Record<string, unknown> | undefined;
          text += `- [${f.archetype || "unknown"}] ${f.domain || "?"}: ${f.text_content || "(no text)"}\n`;
          text += `  ID: ${f.fragment_id}  |  attention: ${eng?.attention_score ?? 0}\n`;
        }
      }

      return {
        content: [{ type: "text", text }],
        details: result,
      };
    },
  };
}
