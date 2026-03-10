import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireStaff } from "../middlewares/role-guard.js";
import { validate } from "../middlewares/validate.js";
import {
  checkoutSchema,
  orderIdParamSchema,
  orderQuerySchema,
  updateOrderStatusSchema,
} from "../schemas/order.schema.js";
import * as ctrl from "../controllers/order.controller.js";

const router = Router();

// Customer routes
router.post("/checkout", authenticate, validate(checkoutSchema), ctrl.checkout);
router.get(
  "/my",
  authenticate,
  validate(orderQuerySchema, "query"),
  ctrl.findMyOrders,
);
router.get(
  "/my/:id",
  authenticate,
  validate(orderIdParamSchema, "params"),
  ctrl.findById,
);

// Admin/Staff routes
router.get(
  "/",
  authenticate,
  requireStaff,
  validate(orderQuerySchema, "query"),
  ctrl.findAllOrders,
);
router.get(
  "/:id",
  authenticate,
  requireStaff,
  validate(orderIdParamSchema, "params"),
  ctrl.findByIdAdmin,
);
router.patch(
  "/:id/status",
  authenticate,
  requireStaff,
  validate(orderIdParamSchema, "params"),
  validate(updateOrderStatusSchema),
  ctrl.updateStatus,
);

export default router;
