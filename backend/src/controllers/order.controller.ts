import { sendSuccess, sendPaginated } from "../lib/response.js";
import type { TypedHandler, IdParam } from "../lib/typed-request.js";
import * as orderService from "../services/order.service.js";
import type {
  CheckoutInput,
  OrderQuery,
  UpdateOrderStatusInput,
} from "../schemas/order.schema.js";

export const checkout: TypedHandler<
  Record<string, string>,
  CheckoutInput
> = async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await orderService.checkout(req.user!.userId, req.body),
      201,
    );
  } catch (e) {
    next(e);
  }
};

export const findMyOrders: TypedHandler<
  Record<string, string>,
  unknown,
  OrderQuery
> = async (req, res, next) => {
  try {
    const result = await orderService.findAll(req.query, req.user!.userId);
    sendPaginated(res, result.orders, result.total, result.page, result.limit);
  } catch (e) {
    next(e);
  }
};

export const findAllOrders: TypedHandler<
  Record<string, string>,
  unknown,
  OrderQuery
> = async (req, res, next) => {
  try {
    const result = await orderService.findAll(req.query);
    sendPaginated(res, result.orders, result.total, result.page, result.limit);
  } catch (e) {
    next(e);
  }
};

export const findById: TypedHandler<IdParam> = async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await orderService.findById(req.params.id, req.user!.userId),
    );
  } catch (e) {
    next(e);
  }
};

export const findByIdAdmin: TypedHandler<IdParam> = async (req, res, next) => {
  try {
    sendSuccess(res, await orderService.findById(req.params.id));
  } catch (e) {
    next(e);
  }
};

export const updateStatus: TypedHandler<
  IdParam,
  UpdateOrderStatusInput
> = async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await orderService.updateStatus(
        req.params.id,
        req.body,
        req.user!.userId,
      ),
    );
  } catch (e) {
    next(e);
  }
};
