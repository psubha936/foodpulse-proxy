import { Router } from "express";
import type { ServiceConfig } from "../config/service-config.js";
import { ErrorCode } from "../enums/error-code.enum.js";
import { HttpStatus } from "../enums/http-status.enum.js";
import { AppError } from "../errors/app-error.js";

export function createIdentityRouter(config: ServiceConfig): Router {
  const router = Router();

  router.post("/api/v1/identity/roles", async (request, response) => {
    const apiKey = request.header("x-api-key");
    if (!apiKey || !config.apiKeys.includes(apiKey)) {
      throw new AppError({
        status: HttpStatus.UNAUTHORIZED,
        code: ErrorCode.UNAUTHENTICATED,
        message: "Invalid API key",
      });
    }

    let upstream: globalThis.Response;
    try {
      upstream = await fetch(`${config.identityServiceUrl}/roles`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": String(response.locals.requestId),
        },
        body: JSON.stringify(request.body),
        signal: AbortSignal.timeout(config.upstreamTimeoutMs),
      });
    } catch (error) {
      throw new AppError({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: ErrorCode.UPSTREAM_SERVICE_ERROR,
        message: "Identity service is unavailable",
        cause: error,
      });
    }

    const contentType = upstream.headers.get("content-type");
    if (contentType) response.setHeader("content-type", contentType);
    const body = Buffer.from(await upstream.arrayBuffer());
    response.status(upstream.status);
    if (body.length === 0) {
      response.end();
      return;
    }
    response.send(body);
  });

  return router;
}
