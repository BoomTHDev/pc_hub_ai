import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireStaff } from "../middlewares/role-guard.js";
import { validate } from "../middlewares/validate.js";
import {
  createInventoryTransactionSchema,
  inventoryQuerySchema,
  lowStockQuerySchema,
} from "../schemas/inventory.schema.js";
import * as ctrl from "../controllers/inventory.controller.js";

const router = Router();

// All inventory routes require staff access
router.use(authenticate, requireStaff);

router.get("/", validate(inventoryQuerySchema, "query"), ctrl.findAll);
router.get("/low-stock", validate(lowStockQuerySchema, "query"), ctrl.getLowStock);
router.post(
  "/",
  validate(createInventoryTransactionSchema),
  ctrl.createTransaction,
);

export default router;
