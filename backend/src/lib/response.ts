import type { Response } from "express";
import type { JsonObject, JsonValue } from "./json.js";

// Standardized API response envelope
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: JsonObject;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: JsonValue;
  };
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Send a success response
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: JsonObject,
): void {
  const response: SuccessResponse<T> = { success: true, data };
  if (meta) {
    response.meta = meta;
  }
  res.status(statusCode).json(response);
}

// Send a paginated success response
export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
): void {
  sendSuccess(res, data, 200, {
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// Send an error response
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: JsonValue,
): void {
  const response: ErrorResponse = {
    success: false,
    error: { code, message },
  };
  if (details !== undefined) {
    response.error.details = details;
  }
  res.status(statusCode).json(response);
}

export type { ApiResponse, SuccessResponse, ErrorResponse };
