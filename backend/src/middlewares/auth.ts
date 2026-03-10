import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { errors } from "../lib/errors.js";
import type { UserRole } from "../generated/prisma/client.js";

// Extend Express Request to include authenticated user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
        email: string;
      };
    }
  }
}

// Authenticate any user (CUSTOMER, STAFF, ADMIN) via Bearer token
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw errors.unauthorized("Missing or invalid authorization header");
  }

  const token = authHeader.slice(7);
  if (!token) {
    throw errors.unauthorized("Missing token");
  }

  const decoded = verifyAccessToken(token);
  req.user = {
    userId: decoded.userId,
    role: decoded.role,
    email: decoded.email,
  };

  next();
}
