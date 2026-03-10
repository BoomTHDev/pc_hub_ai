import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendPaginated } from "../lib/response.js";
import * as orderService from "../services/order.service.js";
import type {
  CheckoutInput,
  OrderQuery,
  UpdateOrderStatusInput,
} from "../schemas/order.schema.js";

export async function checkout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await orderService.checkout(
      req.user!.userId,
      req.body as CheckoutInput,
    );
    sendSuccess(res, result, 201);
  } catch (e) {
    next(e);
  }
}

export async function findMyOrders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as OrderQuery;
    const result = await orderService.findAll(query, req.user!.userId);
    sendPaginated(res, result.orders, result.total, result.page, result.limit);
  } catch (e) {
    next(e);
  }
}

export async function findAllOrders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as OrderQuery;
    const result = await orderService.findAll(query);
    sendPaginated(res, result.orders, result.total, result.page, result.limit);
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
    sendSuccess(
      res,
      await orderService.findById(req.params.id as string, req.user!.userId),
    );
  } catch (e) {
    next(e);
  }
}

export async function findByIdAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await orderService.findById(req.params.id as string));
  } catch (e) {
    next(e);
  }
}

export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await orderService.updateStatus(
      req.params.id as string,
      req.body as UpdateOrderStatusInput,
      req.user!.userId,
    );
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}
