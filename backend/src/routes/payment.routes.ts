import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireStaff } from "../middlewares/role-guard.js";
import { validate } from "../middlewares/validate.js";
import { uploadSingleImage } from "../middlewares/upload.js";
import {
  paymentReviewSchema,
  paymentQuerySchema,
  markCodPaidSchema,
} from "../schemas/payment.schema.js";
import * as ctrl from "../controllers/payment.controller.js";

const router = Router();

// Customer: upload slip
router.post("/:id/slip", authenticate, uploadSingleImage, ctrl.uploadSlip);

// Admin/Staff routes
router.get(
  "/",
  authenticate,
  requireStaff,
  validate(paymentQuerySchema, "query"),
  ctrl.findAll,
);
router.get("/:id", authenticate, requireStaff, ctrl.findById);
router.post(
  "/:id/review",
  authenticate,
  requireStaff,
  validate(paymentReviewSchema),
  ctrl.reviewPayment,
);
router.post(
  "/:id/cod-paid",
  authenticate,
  requireStaff,
  validate(markCodPaidSchema),
  ctrl.markCodPaid,
);

export default router;
