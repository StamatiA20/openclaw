/**
 * ZohGraphClient — HTTP client for the Zoh graph probing API.
 *
 * All methods call /api/graph/* endpoints on the Zoh backend.
 */

import type { ResolvedZohConfig } from "./config.js";

export interface ProbeParams {
  archetype?: string;
  query?: string;
  domain?: string;
  min_engagement?: number;
  limit?: number;
}

export interface SimilarParams {
  fragment_id: string;
  method?: "structural" | "semantic" | "both";
  limit?: number;
}

export interface ConnectionsParams {
  fragment_id: string;
  direction?: "outgoing" | "incoming" | "both";
  min_weight?: number;
  limit?: number;
}

export interface UserPathParams {
  user_id?: string;
  limit?: number;
  since?: string;
}

export interface RecommendParams {
  current_fragment_id: string;
  exclude_ids?: string[];
  limit?: number;
}

export class ZohGraphClient {
  private config: ResolvedZohConfig;

  constructor(config: ResolvedZohConfig) {
    this.config = config;
  }

  async probe(params: ProbeParams): Promise<unknown> {
    return this.post("/api/graph/probe", params);
  }

  async similar(params: SimilarParams): Promise<unknown> {
    const { fragment_id, ...query } = params;
    const qs = new URLSearchParams();
    if (query.method) qs.set("method", query.method);
    if (query.limit !== undefined) qs.set("limit", String(query.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return this.get(`/api/graph/fragment/${fragment_id}/similar${suffix}`);
  }

  async connections(params: ConnectionsParams): Promise<unknown> {
    const { fragment_id, ...query } = params;
    const qs = new URLSearchParams();
    if (query.direction) qs.set("direction", query.direction);
    if (query.min_weight !== undefined) qs.set("min_weight", String(query.min_weight));
    if (query.limit !== undefined) qs.set("limit", String(query.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return this.get(`/api/graph/fragment/${fragment_id}/connections${suffix}`);
  }

  async userPath(params: UserPathParams): Promise<unknown> {
    const qs = new URLSearchParams();
    if (params.user_id) qs.set("user_id", params.user_id);
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.since) qs.set("since", params.since);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return this.get(`/api/graph/user-path${suffix}`);
  }

  async recommend(params: RecommendParams): Promise<unknown> {
    return this.post("/api/graph/recommend-next", params);
  }

  private async get(path: string): Promise<unknown> {
    const url = `${this.config.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Zoh API ${res.status}: ${body || res.statusText}`);
      }
      return res.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async post(path: string, body: unknown): Promise<unknown> {
    const url = `${this.config.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Zoh API ${res.status}: ${text || res.statusText}`);
      }
      return res.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}
