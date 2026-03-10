import { sendSuccess, sendPaginated } from "../lib/response.js";
import type { TypedHandler, IdParam } from "../lib/typed-request.js";
import * as inventoryService from "../services/inventory.service.js";
import type {
  CreateInventoryTransactionInput,
  InventoryQuery,
} from "../schemas/inventory.schema.js";

export const createTransaction: TypedHandler<
  Record<string, string>,
  CreateInventoryTransactionInput
> = async (req, res, next) => {
  try {
    sendSuccess(res, await inventoryService.createTransaction(req.body), 201);
  } catch (e) {
    next(e);
  }
};

export const findAll: TypedHandler<
  Record<string, string>,
  unknown,
  InventoryQuery
> = async (req, res, next) => {
  try {
    const result = await inventoryService.findAll(req.query);
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
};

export const getLowStock: TypedHandler<
  Record<string, string>,
  unknown,
  { threshold?: string }
> = async (req, res, next) => {
  try {
    const threshold = req.query.threshold
      ? parseInt(req.query.threshold, 10)
      : 10;
    sendSuccess(res, await inventoryService.getLowStockProducts(threshold));
  } catch (e) {
    next(e);
  }
};
