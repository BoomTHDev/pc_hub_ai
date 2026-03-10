import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  addToCartSchema,
  cartItemParamSchema,
  updateCartItemSchema,
} from "../schemas/cart.schema.js";
import * as ctrl from "../controllers/cart.controller.js";

const router = Router();

// All cart routes require authentication
router.use(authenticate);

router.get("/", ctrl.getCart);
router.post("/items", validate(addToCartSchema), ctrl.addItem);
router.put(
  "/items/:productId",
  validate(cartItemParamSchema, "params"),
  validate(updateCartItemSchema),
  ctrl.updateItem,
);
router.delete(
  "/items/:productId",
  validate(cartItemParamSchema, "params"),
  ctrl.removeItem,
);
router.delete("/clear", ctrl.clearCart);

export default router;
