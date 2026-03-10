import type {
  Request,
  Response,
  NextFunction,
  ParamsDictionary,
} from "express";
import type { ParsedQs } from "qs";

/**
 * Strongly-typed Express Request — eliminates `as Type` casts in controllers.
 *
 * @template P Route params (e.g. `{ id: string }`)
 * @template B Request body type (e.g. `CreateCategoryInput`)
 * @template Q Query params type (e.g. `ProductQuery`)
 */
export type TypedRequest<
  P extends Record<string, string> = Record<string, string>,
  B = unknown,
  Q extends ParsedQs = ParsedQs,
> = Request<P & ParamsDictionary, unknown, B, Q>;

/**
 * Express handler with typed request.
 */
export type TypedHandler<
  P extends Record<string, string> = Record<string, string>,
  B = unknown,
  Q extends ParsedQs = ParsedQs,
> = (
  req: TypedRequest<P, B, Q>,
  res: Response,
  next: NextFunction,
) => Promise<void>;

// Common param shapes
export type IdParam = { id: string };
export type SlugParam = { slug: string };
export type ProductIdParam = { productId: string };
export type ImageIdParam = { id: string; imageId: string };
