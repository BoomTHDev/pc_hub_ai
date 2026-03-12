import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireStaff } from "../middlewares/role-guard.js";
import { validate } from "../middlewares/validate.js";
import {
  createBrandSchema,
  brandIdParamSchema,
  updateBrandSchema,
} from "../schemas/brand.schema.js";
import * as ctrl from "../controllers/brand.controller.js";

const router = Router();

router.get("/", ctrl.findAll);
router.get("/:id", validate(brandIdParamSchema, "params"), ctrl.findById);
router.post(
  "/",
  authenticate,
  requireStaff,
  validate(createBrandSchema),
  ctrl.create,
);
router.put(
  "/:id",
  authenticate,
  requireStaff,
  validate(brandIdParamSchema, "params"),
  validate(updateBrandSchema),
  ctrl.update,
);
router.delete(
  "/:id",
  authenticate,
  requireStaff,
  validate(brandIdParamSchema, "params"),
  ctrl.remove,
);

export default router;
