import express, { type Express } from "express";
import helmet from "helmet";
import type { ServiceConfig } from "./config/service-config.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";
import { notFoundHandler } from "./middleware/not-found.middleware.js";
import { requestContext } from "./middleware/request-context.middleware.js";
import { createSystemRouter } from "./routes/system.routes.js";

export function createApp(config: ServiceConfig): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(requestContext);
  app.use(createSystemRouter(config));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
