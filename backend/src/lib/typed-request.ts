import type {
  Request,
  Response,
  NextFunction,
} from "express";
import type { ParamsDictionary } from "express-serve-static-core";

/**
 * Strongly-typed Express Request — eliminates `as Type` casts in controllers.
 *
 * @template P Route params (e.g. `{ id: string }`)
 * @template B Request body type (e.g. `CreateCategoryInput`)
 * @template Q Query params type (e.g. `ProductQuery`)
 */
export type TypedRequest<
  P extends ParamsDictionary = ParamsDictionary,
  B = object,
  Q = object,
> = Request<P, object, B, Q>;

/**
 * Express handler with typed request.
 */
export type TypedHandler<
  P extends ParamsDictionary = ParamsDictionary,
  B = object,
  Q = object,
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
