import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { sendError } from "../lib/response.js";

type ValidationTarget = "body" | "query" | "params";

// Create a validation middleware for a given Zod schema and target
export function validate<TOutput>(
  schema: z.ZodType<TOutput>,
  target: ValidationTarget = "body",
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = req[target];
    const result = schema.safeParse(data);

    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      sendError(
        _res,
        400,
        "VALIDATION_ERROR",
        "Validation failed",
        formattedErrors,
      );
      return;
    }

    // Replace request data with parsed/coerced values.
    if (target === "body") {
      req.body = result.data;
    } else if (target === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
      });
    } else if (target === "params") {
      Object.defineProperty(req, "params", {
        value: result.data,
        writable: true,
        configurable: true,
      });
    }

    next();
  };
}
