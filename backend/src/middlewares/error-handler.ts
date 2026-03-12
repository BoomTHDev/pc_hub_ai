import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";
import type { JsonObject } from "../lib/json.js";
import { sendError } from "../lib/response.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

interface ErrorWithCode extends Error {
  code: string;
  meta?: JsonObject;
}

function hasCode(error: Error): error is ErrorWithCode {
  return "code" in error && typeof error.code === "string";
}

// Centralized error handling middleware
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Handle known operational errors
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message);
    return;
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    sendError(res, 401, "INVALID_TOKEN", "Invalid token");
    return;
  }
  if (err.name === "TokenExpiredError") {
    sendError(res, 401, "TOKEN_EXPIRED", "Token has expired");
    return;
  }

  // Handle Prisma known request errors
  if (err.constructor.name === "PrismaClientKnownRequestError" && hasCode(err)) {
    if (err.code === "P2002") {
      sendError(
        res,
        409,
        "DUPLICATE_ENTRY",
        "A record with this value already exists",
      );
      return;
    }
    if (err.code === "P2025") {
      sendError(res, 404, "NOT_FOUND", "Record not found");
      return;
    }
  }

  // Handle multer errors
  if (err.constructor.name === "MulterError" && hasCode(err)) {
    if (err.code === "LIMIT_FILE_SIZE") {
      sendError(res, 400, "FILE_TOO_LARGE", "File size exceeds the limit");
      return;
    }
    sendError(res, 400, "UPLOAD_ERROR", err.message);
    return;
  }

  // Unexpected errors
  logger.error(
    `Unhandled error: ${err.message}`,
    "ErrorHandler",
    env.NODE_ENV === "development" && err.stack
      ? { stack: err.stack }
      : undefined,
  );

  sendError(
    res,
    500,
    "INTERNAL_ERROR",
    env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message,
  );
}
