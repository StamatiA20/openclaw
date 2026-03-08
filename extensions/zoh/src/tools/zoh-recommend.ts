/**
 * zoh_recommend — "What should come next?"
 *
 * Given the current fragment, recommends the best next fragments
 * based on graph connections, embedding similarity, and trending engagement.
 */

import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "openclaw/plugin-sdk";
import type { ZohGraphClient } from "../client.js";

const ZohRecommendSchema = Type.Object(
  {
    current_fragment_id: Type.String({
      description: "The fragment ID the user is currently viewing.",
    }),
    exclude_ids: Type.Optional(
      Type.Array(Type.String(), {
        description: "Fragment IDs the user has already seen (to avoid repeats).",
      }),
    ),
    limit: Type.Optional(
      Type.Number({
        description: "Max recommendations (1-10). Default: 3.",
        minimum: 1,
        maximum: 10,
      }),
    ),
  },
  { additionalProperties: false },
);

export function createZohRecommendTool(client: ZohGraphClient): AnyAgentTool {
  return {
    name: "zoh_recommend",
    label: "Zoh Recommend",
    description:
      "Get the recommended next fragment(s) based on graph connections, content similarity, and engagement trends.",
    parameters: ZohRecommendSchema,
    execute: async (_toolCallId, params) => {
      const result = (await client.recommend(params)) as {
        recommendations: Array<Record<string, unknown>>;
      };

      const recs = result.recommendations || [];
      let text = `${recs.length} recommendation(s):\n\n`;

      for (const r of recs) {
        const eng = r.engagement as Record<string, unknown> | undefined;
        text += `- [${r.archetype || "?"}] ${r.domain || "?"}: ${r.text_content || "(no text)"}\n`;
        text += `  ID: ${r.fragment_id}  |  score: ${r.score}  |  reason: ${r.reason}`;
        if (r.connection_weight) text += `  |  weight: ${r.connection_weight}`;
        if (r.similarity_score) text += `  |  similarity: ${r.similarity_score}`;
        text += `  |  attention: ${eng?.attention_score ?? 0}\n`;
      }

      return {
        content: [{ type: "text", text }],
        details: result,
      };
    },
  };
}
