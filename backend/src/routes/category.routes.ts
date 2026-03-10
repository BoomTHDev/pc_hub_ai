import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireStaff } from "../middlewares/role-guard.js";
import { validate } from "../middlewares/validate.js";
import {
  createCategorySchema,
  categoryIdParamSchema,
  updateCategorySchema,
} from "../schemas/category.schema.js";
import * as ctrl from "../controllers/category.controller.js";

const router = Router();

// Public
router.get("/", ctrl.findAll);
router.get("/:id", validate(categoryIdParamSchema, "params"), ctrl.findById);

// Admin/Staff
router.post(
  "/",
  authenticate,
  requireStaff,
  validate(createCategorySchema),
  ctrl.create,
);
router.put(
  "/:id",
  authenticate,
  requireStaff,
  validate(categoryIdParamSchema, "params"),
  validate(updateCategorySchema),
  ctrl.update,
);
router.delete(
  "/:id",
  authenticate,
  requireStaff,
  validate(categoryIdParamSchema, "params"),
  ctrl.remove,
);

export default router;
