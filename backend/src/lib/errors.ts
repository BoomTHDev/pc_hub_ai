// Standardized application error with HTTP status code and error code
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Common error factory functions
export const errors = {
  badRequest(message: string, code = "BAD_REQUEST") {
    return new AppError(message, 400, code);
  },
  unauthorized(message = "Unauthorized", code = "UNAUTHORIZED") {
    return new AppError(message, 401, code);
  },
  forbidden(message = "Forbidden", code = "FORBIDDEN") {
    return new AppError(message, 403, code);
  },
  notFound(message = "Resource not found", code = "NOT_FOUND") {
    return new AppError(message, 404, code);
  },
  conflict(message: string, code = "CONFLICT") {
    return new AppError(message, 409, code);
  },
  unprocessable(message: string, code = "UNPROCESSABLE_ENTITY") {
    return new AppError(message, 422, code);
  },
  tooManyRequests(message = "Too many requests", code = "RATE_LIMIT") {
    return new AppError(message, 429, code);
  },
  internal(message = "Internal server error", code = "INTERNAL_ERROR") {
    return new AppError(message, 500, code, false);
  },
} as const;
