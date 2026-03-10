import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../lib/response.js";
import * as brandService from "../services/brand.service.js";
import type {
  CreateBrandInput,
  UpdateBrandInput,
} from "../schemas/brand.schema.js";

export async function findAll(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await brandService.findAll());
  } catch (e) {
    next(e);
  }
}

export async function findById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await brandService.findById(req.params.id as string));
  } catch (e) {
    next(e);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(
      res,
      await brandService.create(req.body as CreateBrandInput),
      201,
    );
  } catch (e) {
    next(e);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(
      res,
      await brandService.update(
        req.params.id as string,
        req.body as UpdateBrandInput,
      ),
    );
  } catch (e) {
    next(e);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await brandService.remove(req.params.id as string);
    sendSuccess(res, { message: "Brand deleted" });
  } catch (e) {
    next(e);
  }
}
