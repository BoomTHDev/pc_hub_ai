import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../lib/response.js";
import * as categoryService from "../services/category.service.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../schemas/category.schema.js";

export async function findAll(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await categoryService.findAll());
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
    sendSuccess(res, await categoryService.findById(req.params.id as string));
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
    const result = await categoryService.create(
      req.body as CreateCategoryInput,
    );
    sendSuccess(res, result, 201);
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
      await categoryService.update(
        req.params.id as string,
        req.body as UpdateCategoryInput,
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
    await categoryService.remove(req.params.id as string);
    sendSuccess(res, { message: "Category deleted" });
  } catch (e) {
    next(e);
  }
}
