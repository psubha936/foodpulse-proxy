import type { RequestHandler } from "express";
import { logger } from "../utils/logger.util.js";

export const requestLogger: RequestHandler = (request, response, next) => {
  const startedAt = performance.now();

  response.once("finish", () => {
    logger.info("HTTP request completed", {
      requestId: String(response.locals.requestId),
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      durationMs: Math.round(performance.now() - startedAt),
    });
  });

  next();
};

