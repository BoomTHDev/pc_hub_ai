import { sendSuccess } from "../lib/response.js";
import type { TypedHandler, ProductIdParam } from "../lib/typed-request.js";
import * as cartService from "../services/cart.service.js";
import type {
  AddToCartInput,
  UpdateCartItemInput,
} from "../schemas/cart.schema.js";

export const getCart: TypedHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await cartService.getCart(req.user!.userId));
  } catch (e) {
    next(e);
  }
};

export const addItem: TypedHandler<
  Record<string, string>,
  AddToCartInput
> = async (req, res, next) => {
  try {
    sendSuccess(res, await cartService.addItem(req.user!.userId, req.body));
  } catch (e) {
    next(e);
  }
};

export const updateItem: TypedHandler<
  ProductIdParam,
  UpdateCartItemInput
> = async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await cartService.updateItemQuantity(
        req.user!.userId,
        req.params.productId,
        req.body,
      ),
    );
  } catch (e) {
    next(e);
  }
};

export const removeItem: TypedHandler<ProductIdParam> = async (
  req,
  res,
  next,
) => {
  try {
    sendSuccess(
      res,
      await cartService.removeItem(req.user!.userId, req.params.productId),
    );
  } catch (e) {
    next(e);
  }
};

export const clearCart: TypedHandler = async (req, res, next) => {
  try {
    await cartService.clearCart(req.user!.userId);
    sendSuccess(res, { message: "Cart cleared" });
  } catch (e) {
    next(e);
  }
};
