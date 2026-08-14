import type { ErrorRequestHandler } from "express";
import { ErrorCode } from "../enums/error-code.enum.js";
import { HttpStatus } from "../enums/http-status.enum.js";
import { AppError } from "../errors/app-error.js";
import type { ApiError } from "../types/api-response.js";

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (
    error instanceof SyntaxError &&
    typeof error === "object" &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    return new AppError({
      status: HttpStatus.BAD_REQUEST,
      code: ErrorCode.VALIDATION_ERROR,
      message: "Request body contains invalid JSON",
      cause: error,
    });
  }

  return new AppError({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    code: ErrorCode.INTERNAL_ERROR,
    message: "An unexpected error occurred",
    cause: error,
    isOperational: false,
  });
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const appError = normalizeError(error);

  const requestId = String(response.locals.requestId ?? "unknown");
  const payload: ApiError = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details === undefined ? {} : { details: appError.details }),
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };

  if (!appError.isOperational) {
    console.error(
      JSON.stringify({
        level: "error",
        requestId,
        code: appError.code,
        message: appError.message,
        stack: appError.stack,
      }),
    );
  }

  response.status(appError.status).json(payload);
};
