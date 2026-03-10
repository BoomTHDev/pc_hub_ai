import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/role-guard.js";
import { validate } from "../middlewares/validate.js";
import {
  addressIdParamSchema,
  updateProfileSchema,
  createAddressSchema,
  toggleUserActiveSchema,
  updateAddressSchema,
  userIdParamSchema,
  userListQuerySchema,
} from "../schemas/user.schema.js";
import * as ctrl from "../controllers/user.controller.js";

const router = Router();

// Profile (authenticated user)
router.put(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  ctrl.updateProfile,
);

// Addresses (authenticated user)
router.get("/addresses", authenticate, ctrl.getAddresses);
router.get(
  "/addresses/:id",
  authenticate,
  validate(addressIdParamSchema, "params"),
  ctrl.getAddressById,
);
router.post(
  "/addresses",
  authenticate,
  validate(createAddressSchema),
  ctrl.createAddress,
);
router.put(
  "/addresses/:id",
  authenticate,
  validate(addressIdParamSchema, "params"),
  validate(updateAddressSchema),
  ctrl.updateAddress,
);
router.delete(
  "/addresses/:id",
  authenticate,
  validate(addressIdParamSchema, "params"),
  ctrl.deleteAddress,
);

// Admin: user management
router.get(
  "/",
  authenticate,
  requireAdmin,
  validate(userListQuerySchema, "query"),
  ctrl.findAllUsers,
);
router.patch(
  "/:id/active",
  authenticate,
  requireAdmin,
  validate(userIdParamSchema, "params"),
  validate(toggleUserActiveSchema),
  ctrl.toggleUserActive,
);

export default router;
