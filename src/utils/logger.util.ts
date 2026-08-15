import { SERVICE_NAME } from "../config/service-config.js";

type LogContext = Record<string, unknown>;

function writeLog(
  level: "info" | "warn" | "error",
  message: string,
  context: LogContext = {},
): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    ...context,
    message,
  });

  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}

export const logger = {
  info(message: string, context?: LogContext): void {
    writeLog("info", message, context);
  },
  warn(message: string, context?: LogContext): void {
    writeLog("warn", message, context);
  },
  error(message: string, error: unknown, context: LogContext = {}): void {
    writeLog("error", message, {
      ...context,
      error: error instanceof Error
        ? { name: error.name, message: error.message }
        : String(error),
    });
  },
};

