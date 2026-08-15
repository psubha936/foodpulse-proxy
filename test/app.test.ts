import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createApp } from "../src/app.js";
import { loadServiceConfig } from "../src/config/service-config.js";
import { ErrorCode } from "../src/enums/error-code.enum.js";

const testEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  X_API_KEYS: "test-client-key, second-client-key",
};

test("health and error responses use the common API contract", async (context) => {
  const config = loadServiceConfig(testEnvironment);
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

test("role creation is forwarded to identity-service with its request ID", async (context) => {
  let receivedRequestId: string | undefined;
  const identityServer = createServer((request, response) => {
    receivedRequestId = request.headers["x-request-id"];
    response.writeHead(201, { "content-type": "application/json" });
    response.end(JSON.stringify({ success: true, data: { publicId: "role_test" } }));
  });
  identityServer.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => identityServer.once("listening", resolve));
  context.after(() => new Promise<void>((resolve, reject) => {
    identityServer.close((error) => (error ? reject(error) : resolve()));
  }));

  const identityPort = (identityServer.address() as AddressInfo).port;
  const config = loadServiceConfig({
    NODE_ENV: "test",
    IDENTITY_SERVICE_URL: `http://127.0.0.1:${identityPort}`,
    X_API_KEYS: "test-client-key, second-client-key",
  });
  const proxyServer = createApp(config).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => proxyServer.once("listening", resolve));
  context.after(() => new Promise<void>((resolve, reject) => {
    proxyServer.close((error) => (error ? reject(error) : resolve()));
  }));

  const proxyPort = (proxyServer.address() as AddressInfo).port;
  const unauthorized = await fetch(
    `http://127.0.0.1:${proxyPort}/api/v1/identity/roles`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "blocked" }),
    },
  );
  assert.equal(unauthorized.status, 401);

  const response = await fetch(
    `http://127.0.0.1:${proxyPort}/api/v1/identity/roles`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": "role-flow-test",
        "x-api-key": "test-client-key",
      },
      body: JSON.stringify({
        code: "restaurant_support",
        name: "Restaurant support",
        permissions: ["restaurant.read"],
      }),
    },
  );
  const payload = await response.json() as {
    success: boolean;
    data: { publicId: string };
  };

  assert.equal(response.status, 201);
  assert.equal(payload.data.publicId, "role_test");
  assert.equal(receivedRequestId, "role-flow-test");
});
