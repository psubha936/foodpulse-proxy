import type { Server } from "node:http";
import { createApp } from "./app.js";
import { loadServiceConfig } from "./config/service-config.js";

export async function bootstrap(): Promise<Server> {
  const config = loadServiceConfig();
  const app = createApp(config);

  const server = app.listen(config.port, config.host, () => {
    console.info(
      JSON.stringify({
        level: "info",
        message: "service started",
        service: config.serviceName,
        host: config.host,
        port: config.port,
        environment: config.nodeEnv,
      }),
    );
  });

  server.requestTimeout = 30_000;
  server.headersTimeout = 35_000;
  server.keepAliveTimeout = 5_000;

  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals): void => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.info(
      JSON.stringify({
        level: "info",
        message: "service shutting down",
        service: config.serviceName,
        signal,
      }),
    );

    server.close((error) => {
      if (error) {
        console.error(error);
        process.exitCode = 1;
      }
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  return server;
}
