import { sendSuccess, sendPaginated } from "../lib/response.js";
import type { TypedHandler, IdParam } from "../lib/typed-request.js";
import * as userService from "../services/user.service.js";
import type {
  UpdateProfileInput,
  CreateAddressInput,
  UpdateAddressInput,
} from "../schemas/user.schema.js";

// Profile
export const updateProfile: TypedHandler<
  Record<string, string>,
  UpdateProfileInput
> = async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await userService.updateProfile(req.user!.userId, req.body),
    );
  } catch (e) {
    next(e);
  }
};

// Addresses
export const getAddresses: TypedHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await userService.getAddresses(req.user!.userId));
  } catch (e) {
    next(e);
  }
};

export const getAddressById: TypedHandler<IdParam> = async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await userService.getAddressById(req.user!.userId, req.params.id),
    );
  } catch (e) {
    next(e);
  }
};

export const createAddress: TypedHandler<
  Record<string, string>,
  CreateAddressInput
> = async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await userService.createAddress(req.user!.userId, req.body),
      201,
    );
  } catch (e) {
    next(e);
  }
};

export const updateAddress: TypedHandler<IdParam, UpdateAddressInput> = async (
  req,
  res,
  next,
) => {
  try {
    sendSuccess(
      res,
      await userService.updateAddress(
        req.user!.userId,
        req.params.id,
        req.body,
      ),
    );
  } catch (e) {
    next(e);
  }
};

export const deleteAddress: TypedHandler<IdParam> = async (req, res, next) => {
  try {
    await userService.deleteAddress(req.user!.userId, req.params.id);
    sendSuccess(res, { message: "Address deleted" });
  } catch (e) {
    next(e);
  }
};

// Admin: user management
export const findAllUsers: TypedHandler<
  Record<string, string>,
  unknown,
  { page?: string; limit?: string; role?: string }
> = async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const role = req.query.role;
    const result = await userService.findAllUsers(page, limit, role);
    sendPaginated(res, result.users, result.total, result.page, result.limit);
  } catch (e) {
    next(e);
  }
};

export const toggleUserActive: TypedHandler<
  IdParam,
  { isActive: boolean }
> = async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await userService.toggleUserActive(req.params.id, req.body.isActive),
    );
  } catch (e) {
    next(e);
  }
};
