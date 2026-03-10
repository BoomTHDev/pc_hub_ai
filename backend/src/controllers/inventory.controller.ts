import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendPaginated } from "../lib/response.js";
import * as inventoryService from "../services/inventory.service.js";
import type {
  CreateInventoryTransactionInput,
  InventoryQuery,
} from "../schemas/inventory.schema.js";

export async function createTransaction(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(
      res,
      await inventoryService.createTransaction(
        req.body as CreateInventoryTransactionInput,
      ),
      201,
    );
  } catch (e) {
    next(e);
  }
}

export async function findAll(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as InventoryQuery;
    const result = await inventoryService.findAll(query);
    sendPaginated(
      res,
      result.transactions,
      result.total,
      result.page,
      result.limit,
    );
  } catch (e) {
    next(e);
  }
}

export async function getLowStock(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const threshold = req.query.threshold
      ? parseInt(req.query.threshold as string, 10)
      : 10;
    sendSuccess(res, await inventoryService.getLowStockProducts(threshold));
  } catch (e) {
    next(e);
  }
}
