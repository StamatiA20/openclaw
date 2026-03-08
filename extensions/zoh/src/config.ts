/**
 * Zoh Plugin Configuration
 *
 * Configures the base URL and timeouts for connecting to the Zoh backend.
 */

export interface ZohPluginConfig {
  /** Base URL of the Zoh backend API (default: http://localhost:5001) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 15000) */
  timeoutMs?: number;
}

export interface ResolvedZohConfig {
  baseUrl: string;
  timeoutMs: number;
}

export const DEFAULT_ZOH_CONFIG: ResolvedZohConfig = {
  baseUrl: "http://localhost:5001",
  timeoutMs: 15_000,
};

export function resolveZohConfig(config: unknown): ResolvedZohConfig {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return { ...DEFAULT_ZOH_CONFIG };
  }

  const raw = config as ZohPluginConfig;
  return {
    baseUrl: (raw.baseUrl?.trim() || DEFAULT_ZOH_CONFIG.baseUrl).replace(/\/+$/, ""),
    timeoutMs:
      typeof raw.timeoutMs === "number" && raw.timeoutMs > 0
        ? raw.timeoutMs
        : DEFAULT_ZOH_CONFIG.timeoutMs,
  };
}
