import type { RequestHandler } from "express";
import { ErrorCode } from "../enums/error-code.enum.js";
import { HttpStatus } from "../enums/http-status.enum.js";
import { AppError } from "../errors/app-error.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(
    new AppError({
      status: HttpStatus.NOT_FOUND,
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: `Route ${request.method} ${request.path} was not found`,
    }),
  );
};
