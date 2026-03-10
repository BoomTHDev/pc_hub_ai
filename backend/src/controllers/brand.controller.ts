import { sendSuccess } from "../lib/response.js";
import type { TypedHandler, IdParam } from "../lib/typed-request.js";
import * as brandService from "../services/brand.service.js";
import type {
  CreateBrandInput,
  UpdateBrandInput,
} from "../schemas/brand.schema.js";

export const findAll: TypedHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await brandService.findAll());
  } catch (e) {
    next(e);
  }
};

export const findById: TypedHandler<IdParam> = async (req, res, next) => {
  try {
    sendSuccess(res, await brandService.findById(req.params.id));
  } catch (e) {
    next(e);
  }
};

export const create: TypedHandler<
  Record<string, string>,
  CreateBrandInput
> = async (req, res, next) => {
  try {
    sendSuccess(res, await brandService.create(req.body), 201);
  } catch (e) {
    next(e);
  }
};

export const update: TypedHandler<IdParam, UpdateBrandInput> = async (
  req,
  res,
  next,
) => {
  try {
    sendSuccess(res, await brandService.update(req.params.id, req.body));
  } catch (e) {
    next(e);
  }
};

export const remove: TypedHandler<IdParam> = async (req, res, next) => {
  try {
    await brandService.remove(req.params.id);
    sendSuccess(res, { message: "Brand deleted" });
  } catch (e) {
    next(e);
  }
};
