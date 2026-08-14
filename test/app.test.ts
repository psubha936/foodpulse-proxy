import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createApp } from "../src/app.js";
import { loadServiceConfig } from "../src/config/service-config.js";
import { ErrorCode } from "../src/enums/error-code.enum.js";

test("health and error responses use the common API contract", async (context) => {
  const config = loadServiceConfig();
  const server = createApp(config).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  context.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  const { port } = server.address() as AddressInfo;
  const healthResponse = await fetch(`http://127.0.0.1:${port}/health`);
  const health = (await healthResponse.json()) as {
    success: boolean;
    data: { service: string; status: string };
    meta: { requestId: string };
  };

  assert.equal(healthResponse.status, 200);
  assert.equal(health.success, true);
  assert.equal(health.data.service, config.serviceName);
  assert.equal(health.data.status, "ok");
  assert.ok(health.meta.requestId);

  const missingResponse = await fetch(`http://127.0.0.1:${port}/missing`);
  const missing = (await missingResponse.json()) as {
    success: boolean;
    error: { code: ErrorCode };
  };

  assert.equal(missingResponse.status, 404);
  assert.equal(missing.success, false);
  assert.equal(missing.error.code, ErrorCode.RESOURCE_NOT_FOUND);

  const invalidJsonResponse = await fetch("http://127.0.0.1:" + port + "/health", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not-json}",
  });
  const invalidJson = (await invalidJsonResponse.json()) as {
    success: boolean;
    error: { code: ErrorCode };
  };

  assert.equal(invalidJsonResponse.status, 400);
  assert.equal(invalidJson.success, false);
  assert.equal(invalidJson.error.code, ErrorCode.VALIDATION_ERROR);
});
