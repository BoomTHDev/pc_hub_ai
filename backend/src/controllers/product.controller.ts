import { sendSuccess, sendPaginated } from "../lib/response.js";
import type {
  TypedHandler,
  IdParam,
  SlugParam,
  ImageIdParam,
} from "../lib/typed-request.js";
import * as productService from "../services/product.service.js";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQuery,
} from "../schemas/product.schema.js";

export const findAll: TypedHandler<
  Record<string, string>,
  unknown,
  ProductQuery
> = async (req, res, next) => {
  try {
    const result = await productService.findAll(req.query);
    sendPaginated(
      res,
      result.products,
      result.total,
      result.page,
      result.limit,
    );
  } catch (e) {
    next(e);
  }
};

export const findById: TypedHandler<IdParam> = async (req, res, next) => {
  try {
    sendSuccess(res, await productService.findById(req.params.id));
  } catch (e) {
    next(e);
  }
};

export const findBySlug: TypedHandler<SlugParam> = async (req, res, next) => {
  try {
    sendSuccess(res, await productService.findBySlug(req.params.slug));
  } catch (e) {
    next(e);
  }
};

export const create: TypedHandler<
  Record<string, string>,
  CreateProductInput
> = async (req, res, next) => {
  try {
    sendSuccess(res, await productService.create(req.body), 201);
  } catch (e) {
    next(e);
  }
};

export const update: TypedHandler<IdParam, UpdateProductInput> = async (
  req,
  res,
  next,
) => {
  try {
    sendSuccess(res, await productService.update(req.params.id, req.body));
  } catch (e) {
    next(e);
  }
};

export const remove: TypedHandler<IdParam> = async (req, res, next) => {
  try {
    await productService.remove(req.params.id);
    sendSuccess(res, { message: "Product deleted" });
  } catch (e) {
    next(e);
  }
};

export const addImage: TypedHandler<IdParam, { isPrimary?: string }> = async (
  req,
  res,
  next,
) => {
  try {
    if (!req.file) {
      res
        .status(400)
        .json({
          success: false,
          error: { code: "NO_FILE", message: "No file uploaded" },
        });
      return;
    }
    const isPrimary = req.body.isPrimary === "true";
    sendSuccess(
      res,
      await productService.addImage(req.params.id, req.file.buffer, isPrimary),
      201,
    );
  } catch (e) {
    next(e);
  }
};

export const removeImage: TypedHandler<ImageIdParam> = async (
  req,
  res,
  next,
) => {
  try {
    await productService.removeImage(req.params.id, req.params.imageId);
    sendSuccess(res, { message: "Image deleted" });
  } catch (e) {
    next(e);
  }
};

export const updateAttributes: TypedHandler<
  IdParam,
  { attributes: Array<{ name: string; value: string }> }
> = async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await productService.updateAttributes(req.params.id, req.body.attributes),
    );
  } catch (e) {
    next(e);
  }
};
