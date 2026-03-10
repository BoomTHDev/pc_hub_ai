import type { Request, Response, NextFunction } from "express";
import { errors } from "../lib/errors.js";
import type { UserRole } from "../generated/prisma/client.js";

// Create a role-based guard middleware that allows only specific roles
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      throw errors.unauthorized("Authentication required");
    }

    if (!allowedRoles.includes(user.role)) {
      throw errors.forbidden(
        "You do not have permission to access this resource",
      );
    }

    next();
  };
}

// Shorthand: require ADMIN or STAFF role
export function requireStaff(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  return requireRole("ADMIN", "STAFF")(req, res, next);
}

// Shorthand: require ADMIN role only
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  return requireRole("ADMIN")(req, res, next);
}
