export const SERVICE_NAME = "foodpulse-proxy" as const;
export const DEFAULT_PORT = 8080;

export type NodeEnvironment = "development" | "test" | "production";

export interface ServiceConfig {
  serviceName: typeof SERVICE_NAME;
  nodeEnv: NodeEnvironment;
  host: string;
  port: number;
  identityServiceUrl: string;
  apiKeys: string[];
  upstreamTimeoutMs: number;
}

function requireValue(environment: NodeJS.ProcessEnv, key: string): string {
  const value = environment[key]?.trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function parseApiKeys(environment: NodeJS.ProcessEnv): string[] {
  const apiKeys = requireValue(environment, "X_API_KEYS")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (apiKeys.length === 0) {
    throw new Error("X_API_KEYS must contain at least one API key");
  }
  return apiKeys;
}

function parseNodeEnvironment(value: string | undefined): NodeEnvironment {
  if (value === undefined || value === "") return "development";
  if (value === "development" || value === "test" || value === "production") {
    return value;
  }
  throw new Error("NODE_ENV must be development, test, or production");
}

function parsePort(value: string | undefined): number {
  if (value === undefined || value === "") return DEFAULT_PORT;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  return port;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  key: string,
): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${key} must be a positive integer`);
  }
  return parsed;
}

function parseServiceUrl(value: string | undefined): string {
  const candidate = value?.trim() || "http://127.0.0.1:8081";
  const url = new URL(candidate);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("IDENTITY_SERVICE_URL must use http or https");
  }
  return url.toString().replace(/\/$/, "");
}

export function loadServiceConfig(
  environment: NodeJS.ProcessEnv = process.env,
): ServiceConfig {
  return {
    serviceName: SERVICE_NAME,
    nodeEnv: parseNodeEnvironment(environment.NODE_ENV),
    host: environment.HOST?.trim() || "0.0.0.0",
    port: parsePort(environment.PORT),
    identityServiceUrl: parseServiceUrl(environment.IDENTITY_SERVICE_URL),
    apiKeys: parseApiKeys(environment),
    upstreamTimeoutMs: parsePositiveInteger(
      environment.UPSTREAM_TIMEOUT_MS,
      10_000,
      "UPSTREAM_TIMEOUT_MS",
    ),
  };
}
