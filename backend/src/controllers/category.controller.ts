import { sendSuccess } from "../lib/response.js";
import type { TypedHandler, IdParam } from "../lib/typed-request.js";
import * as categoryService from "../services/category.service.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../schemas/category.schema.js";

export const findAll: TypedHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await categoryService.findAll());
  } catch (e) {
    next(e);
  }
};

export const findById: TypedHandler<IdParam> = async (req, res, next) => {
  try {
    sendSuccess(res, await categoryService.findById(req.params.id));
  } catch (e) {
    next(e);
  }
};

export const create: TypedHandler<
  Record<string, string>,
  CreateCategoryInput
> = async (req, res, next) => {
  try {
    sendSuccess(res, await categoryService.create(req.body), 201);
  } catch (e) {
    next(e);
  }
};

export const update: TypedHandler<IdParam, UpdateCategoryInput> = async (
  req,
  res,
  next,
) => {
  try {
    sendSuccess(res, await categoryService.update(req.params.id, req.body));
  } catch (e) {
    next(e);
  }
};

export const remove: TypedHandler<IdParam> = async (req, res, next) => {
  try {
    await categoryService.remove(req.params.id);
    sendSuccess(res, { message: "Category deleted" });
  } catch (e) {
    next(e);
  }
};
