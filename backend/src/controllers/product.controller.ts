import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendPaginated } from "../lib/response.js";
import * as productService from "../services/product.service.js";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQuery,
} from "../schemas/product.schema.js";

export async function findAll(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as ProductQuery;
    const result = await productService.findAll(query);
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
}

export async function findById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await productService.findById(req.params.id as string));
  } catch (e) {
    next(e);
  }
}

export async function findBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(
      res,
      await productService.findBySlug(req.params.slug as string),
    );
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
      await productService.create(req.body as CreateProductInput),
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
      await productService.update(
        req.params.id as string,
        req.body as UpdateProductInput,
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
    await productService.remove(req.params.id as string);
    sendSuccess(res, { message: "Product deleted" });
  } catch (e) {
    next(e);
  }
}

export async function addImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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
      await productService.addImage(
        req.params.id as string,
        req.file.buffer,
        isPrimary,
      ),
      201,
    );
  } catch (e) {
    next(e);
  }
}

export async function removeImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await productService.removeImage(
      req.params.id as string,
      req.params.imageId as string,
    );
    sendSuccess(res, { message: "Image deleted" });
  } catch (e) {
    next(e);
  }
}

export async function updateAttributes(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const attributes = req.body.attributes as Array<{
      name: string;
      value: string;
    }>;
    sendSuccess(
      res,
      await productService.updateAttributes(
        req.params.id as string,
        attributes,
      ),
    );
  } catch (e) {
    next(e);
  }
}
