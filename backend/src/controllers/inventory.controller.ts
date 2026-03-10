import { sendSuccess, sendPaginated } from "../lib/response.js";
import type { TypedHandler } from "../lib/typed-request.js";
import * as inventoryService from "../services/inventory.service.js";
import type {
  CreateInventoryTransactionInput,
} from "../schemas/inventory.schema.js";
import {
  inventoryQuerySchema,
  lowStockQuerySchema,
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

export const findAll: TypedHandler = async (req, res, next) => {
  try {
    const query = inventoryQuerySchema.parse(req.query);
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
};

export const getLowStock: TypedHandler<
  Record<string, string>,
  object
> = async (req, res, next) => {
  try {
    const query = lowStockQuerySchema.parse(req.query);
    sendSuccess(
      res,
      await inventoryService.getLowStockProducts(query.threshold),
    );
  } catch (e) {
    next(e);
  }
};
