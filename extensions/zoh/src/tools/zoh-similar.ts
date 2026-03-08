/**
 * zoh_similar — "Find content like this fragment"
 *
 * Finds structurally or semantically similar fragments using
 * GNN embeddings (128-dim) and text embeddings (384-dim).
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

const SIMILARITY_METHODS = ["structural", "semantic", "both"] as const;

const ZohSimilarSchema = Type.Object(
  {
    fragment_id: Type.String({
      description: "The fragment ID to find similar content for.",
    }),
    method: Type.Optional(
      stringEnum(
        SIMILARITY_METHODS,
        "Similarity method: structural (GNN), semantic (text embeddings), or both. Default: both.",
      ),
    ),
    limit: Type.Optional(
      Type.Number({
        description: "Max results (1-20). Default: 10.",
        minimum: 1,
        maximum: 20,
      }),
    ),
  },
  { additionalProperties: false },
);

export function createZohSimilarTool(client: ZohGraphClient): AnyAgentTool {
  return {
    name: "zoh_similar",
    label: "Zoh Similar",
    description:
      "Find content structurally or semantically similar to a fragment. Uses GNN and text embeddings, ranked by engagement.",
    parameters: ZohSimilarSchema,
    execute: async (_toolCallId, params) => {
      const result = (await client.similar(params)) as {
        source: Record<string, unknown>;
        similar: Array<Record<string, unknown>>;
      };

      const count = result.similar?.length ?? 0;
      let text = `Source: [${result.source?.archetype || "?"}] ${result.source?.domain || "?"}\n`;
      text += `Found ${count} similar fragments.\n\n`;

      if (result.similar) {
        for (const f of result.similar) {
          const eng = f.engagement as Record<string, unknown> | undefined;
          text += `- [${f.archetype || "?"}] ${f.domain || "?"}: ${f.text_content || "(no text)"}\n`;
          text += `  ID: ${f.fragment_id}  |  similarity: ${f.similarity_score}  |  method: ${f.similarity_method}  |  attention: ${eng?.attention_score ?? 0}\n`;
        }
      }

      return {
        content: [{ type: "text", text }],
        details: result,
      };
    },
  };
}
