/**
 * zoh_connections — "What's connected to this fragment?"
 *
 * Explores the weighted knowledge graph edges from a fragment.
 * Returns connected fragments with weights and engagement data.
 */

import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "openclaw/plugin-sdk";
import type { ZohGraphClient } from "../client.js";

function stringEnum<T extends readonly string[]>(values: T, description: string) {
  return Type.Unsafe<T[number]>({
    type: "string",
    enum: [...values],
    description,
  });
}

const DIRECTIONS = ["outgoing", "incoming", "both"] as const;

const ZohConnectionsSchema = Type.Object(
  {
    fragment_id: Type.String({
      description: "The fragment ID to explore connections from.",
    }),
    direction: Type.Optional(
      stringEnum(DIRECTIONS, "Edge direction: outgoing, incoming, or both. Default: both."),
    ),
    min_weight: Type.Optional(
      Type.Number({
        description: "Minimum connection weight (0.0-1.0). Default: 0.3.",
        minimum: 0,
        maximum: 1,
      }),
    ),
    limit: Type.Optional(
      Type.Number({
        description: "Max results (1-50). Default: 20.",
        minimum: 1,
        maximum: 50,
      }),
    ),
  },
  { additionalProperties: false },
);

export function createZohConnectionsTool(client: ZohGraphClient): AnyAgentTool {
  return {
    name: "zoh_connections",
    label: "Zoh Connections",
    description:
      "Explore the weighted graph edges from a fragment. Shows connected fragments, connection strength, and engagement.",
    parameters: ZohConnectionsSchema,
    execute: async (_toolCallId, params) => {
      const result = (await client.connections(params)) as {
        source: Record<string, unknown>;
        connections: Array<Record<string, unknown>>;
      };

      const count = result.connections?.length ?? 0;
      let text = `Source: [${result.source?.archetype || "?"}] ${result.source?.domain || "?"}\n`;
      text += `Found ${count} connections.\n\n`;

      if (result.connections) {
        for (const c of result.connections) {
          const eng = c.engagement as Record<string, unknown> | undefined;
          text += `- [${c.archetype || "?"}] ${c.domain || "?"}: ${c.text_content || "(no text)"}\n`;
          text += `  ID: ${c.fragment_id}  |  weight: ${c.connection_weight}  |  dir: ${c.direction}  |  attention: ${eng?.attention_score ?? 0}\n`;
        }
      }

      return {
        content: [{ type: "text", text }],
        details: result,
      };
    },
  };
}
