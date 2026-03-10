import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireStaff } from "../middlewares/role-guard.js";
import { validate } from "../middlewares/validate.js";
import { uploadSingleImage } from "../middlewares/upload.js";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from "../schemas/product.schema.js";
import * as ctrl from "../controllers/product.controller.js";

const router = Router();

// Public
router.get("/", validate(productQuerySchema, "query"), ctrl.findAll);
router.get("/slug/:slug", ctrl.findBySlug);
router.get("/:id", ctrl.findById);

// Admin/Staff
router.post(
  "/",
  authenticate,
  requireStaff,
  validate(createProductSchema),
  ctrl.create,
);
router.put(
  "/:id",
  authenticate,
  requireStaff,
  validate(updateProductSchema),
  ctrl.update,
);
router.delete("/:id", authenticate, requireStaff, ctrl.remove);
router.post(
  "/:id/images",
  authenticate,
  requireStaff,
  uploadSingleImage,
  ctrl.addImage,
);
router.delete(
  "/:id/images/:imageId",
  authenticate,
  requireStaff,
  ctrl.removeImage,
);
router.put(
  "/:id/attributes",
  authenticate,
  requireStaff,
  ctrl.updateAttributes,
);

export default router;
