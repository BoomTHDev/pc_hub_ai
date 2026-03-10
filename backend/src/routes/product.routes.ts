import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireStaff } from "../middlewares/role-guard.js";
import { validate } from "../middlewares/validate.js";
import { uploadSingleImage } from "../middlewares/upload.js";
import {
  createProductSchema,
  productIdParamSchema,
  productImageParamSchema,
  productImageUploadSchema,
  updateProductSchema,
  updateProductAttributesSchema,
  productQuerySchema,
  productSlugParamSchema,
} from "../schemas/product.schema.js";
import * as ctrl from "../controllers/product.controller.js";

const router = Router();

// Public
router.get("/", validate(productQuerySchema, "query"), ctrl.findAll);
router.get(
  "/slug/:slug",
  validate(productSlugParamSchema, "params"),
  ctrl.findBySlug,
);
router.get("/:id", validate(productIdParamSchema, "params"), ctrl.findById);

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
  validate(productIdParamSchema, "params"),
  validate(updateProductSchema),
  ctrl.update,
);
router.delete(
  "/:id",
  authenticate,
  requireStaff,
  validate(productIdParamSchema, "params"),
  ctrl.remove,
);
router.post(
  "/:id/images",
  authenticate,
  requireStaff,
  validate(productIdParamSchema, "params"),
  uploadSingleImage,
  validate(productImageUploadSchema),
  ctrl.addImage,
);
router.delete(
  "/:id/images/:imageId",
  authenticate,
  requireStaff,
  validate(productImageParamSchema, "params"),
  ctrl.removeImage,
);
router.put(
  "/:id/attributes",
  authenticate,
  requireStaff,
  validate(productIdParamSchema, "params"),
  validate(updateProductAttributesSchema),
  ctrl.updateAttributes,
);

export default router;
