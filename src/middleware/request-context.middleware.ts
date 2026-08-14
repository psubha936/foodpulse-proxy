import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

const validRequestId = /^[A-Za-z0-9._:-]{1,100}$/;

export const requestContext: RequestHandler = (request, response, next) => {
  const incomingRequestId = request.header("x-request-id")?.trim();
  const requestId =
    incomingRequestId && validRequestId.test(incomingRequestId)
      ? incomingRequestId
      : randomUUID();

  response.locals.requestId = requestId;
  response.setHeader("x-request-id", requestId);
  next();
};
