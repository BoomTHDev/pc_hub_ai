import type { Request, Response, NextFunction } from "express";
import type { ZodSchema, ZodError } from "zod";
import { sendError } from "../lib/response.js";

type ValidationTarget = "body" | "query" | "params";

// Create a validation middleware for a given Zod schema and target
export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = req[target];
    const result = schema.safeParse(data);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const formattedErrors = zodError.issues.map((issue) => ({
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

    // Replace request data with parsed/coerced values
    // Note: req.query is read-only in Express, so we assign to (req as any)
    if (target === "body") {
      req.body = result.data;
    } else if (target === "query") {
      (req as any).parsedQuery = result.data;
      // Override req.query via Object.defineProperty
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
      });
    } else if (target === "params") {
      Object.defineProperty(req, "params", {
        value: result.data,
        writable: true,
      });
    }

    next();
  };
}
