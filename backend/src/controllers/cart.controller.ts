import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../lib/response.js";
import * as cartService from "../services/cart.service.js";
import type {
  AddToCartInput,
  UpdateCartItemInput,
} from "../schemas/cart.schema.js";

export async function getCart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await cartService.getCart(req.user!.userId));
  } catch (e) {
    next(e);
  }
}

export async function addItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(
      res,
      await cartService.addItem(req.user!.userId, req.body as AddToCartInput),
    );
  } catch (e) {
    next(e);
  }
}

export async function updateItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(
      res,
      await cartService.updateItemQuantity(
        req.user!.userId,
        req.params.productId as string,
        req.body as UpdateCartItemInput,
      ),
    );
  } catch (e) {
    next(e);
  }
}

export async function removeItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(
      res,
      await cartService.removeItem(
        req.user!.userId,
        req.params.productId as string,
      ),
    );
  } catch (e) {
    next(e);
  }
}

export async function clearCart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await cartService.clearCart(req.user!.userId);
    sendSuccess(res, { message: "Cart cleared" });
  } catch (e) {
    next(e);
  }
}
