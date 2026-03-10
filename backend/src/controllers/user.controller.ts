import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendPaginated } from "../lib/response.js";
import * as userService from "../services/user.service.js";
import type {
  UpdateProfileInput,
  CreateAddressInput,
  UpdateAddressInput,
} from "../schemas/user.schema.js";

// Profile
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(
      res,
      await userService.updateProfile(
        req.user!.userId,
        req.body as UpdateProfileInput,
      ),
    );
  } catch (e) {
    next(e);
  }
}

// Addresses
export async function getAddresses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, await userService.getAddresses(req.user!.userId));
  } catch (e) {
    next(e);
  }
}

export async function getAddressById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(
      res,
      await userService.getAddressById(
        req.user!.userId,
        req.params.id as string,
      ),
    );
  } catch (e) {
    next(e);
  }
}

export async function createAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(
      res,
      await userService.createAddress(
        req.user!.userId,
        req.body as CreateAddressInput,
      ),
      201,
    );
  } catch (e) {
    next(e);
  }
}

export async function updateAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(
      res,
      await userService.updateAddress(
        req.user!.userId,
        req.params.id as string,
        req.body as UpdateAddressInput,
      ),
    );
  } catch (e) {
    next(e);
  }
}

export async function deleteAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await userService.deleteAddress(req.user!.userId, req.params.id as string);
    sendSuccess(res, { message: "Address deleted" });
  } catch (e) {
    next(e);
  }
}

// Admin: user management
export async function findAllUsers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 20;
    const role = req.query.role as string | undefined;
    const result = await userService.findAllUsers(page, limit, role);
    sendPaginated(res, result.users, result.total, result.page, result.limit);
  } catch (e) {
    next(e);
  }
}

export async function toggleUserActive(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const isActive = req.body.isActive as boolean;
    sendSuccess(
      res,
      await userService.toggleUserActive(req.params.id as string, isActive),
    );
  } catch (e) {
    next(e);
  }
}
