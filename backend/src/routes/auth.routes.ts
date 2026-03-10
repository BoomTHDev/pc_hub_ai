import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { authenticate } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/role-guard.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  createStaffSchema,
} from "../schemas/auth.schema.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

// Public routes
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshToken,
);
router.post("/logout", validate(refreshTokenSchema), authController.logout);

// Protected routes
router.get("/profile", authenticate, authController.getProfile);
router.post("/logout-all", authenticate, authController.logoutAll);
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);

// Admin routes
router.post(
  "/staff",
  authenticate,
  requireAdmin,
  validate(createStaffSchema),
  authController.createStaffUser,
);

export default router;
