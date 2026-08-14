import type { ErrorCode } from "../enums/error-code.enum.js";
import type { HttpStatus } from "../enums/http-status.enum.js";

export interface AppErrorOptions {
  status: HttpStatus;
  code: ErrorCode;
  message: string;
  details?: unknown;
  cause?: unknown;
  isOperational?: boolean;
}

export class AppError extends Error {
  readonly status: HttpStatus;
  readonly code: ErrorCode;
  readonly details: unknown;
  readonly isOperational: boolean;

  constructor(options: AppErrorOptions) {
    super(options.message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "AppError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    Error.captureStackTrace(this, AppError);
  }
}
