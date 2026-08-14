export const SERVICE_NAME = "foodpulse-proxy" as const;
export const DEFAULT_PORT = 8080;

export type NodeEnvironment = "development" | "test" | "production";

export interface ServiceConfig {
  serviceName: typeof SERVICE_NAME;
  nodeEnv: NodeEnvironment;
  host: string;
  port: number;
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

export function loadServiceConfig(
  environment: NodeJS.ProcessEnv = process.env,
): ServiceConfig {
  return {
    serviceName: SERVICE_NAME,
    nodeEnv: parseNodeEnvironment(environment.NODE_ENV),
    host: environment.HOST?.trim() || "0.0.0.0",
    port: parsePort(environment.PORT),
  };
}
