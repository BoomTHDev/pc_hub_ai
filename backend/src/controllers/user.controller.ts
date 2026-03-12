import { sendSuccess, sendPaginated } from "../lib/response.js";
import type { TypedHandler, IdParam } from "../lib/typed-request.js";
import * as userService from "../services/user.service.js";
import type {
  UpdateProfileInput,
  CreateAddressInput,
  ToggleUserActiveInput,
  UpdateAddressInput,
} from "../schemas/user.schema.js";
import { userListQuerySchema } from "../schemas/user.schema.js";

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
  object
> = async (req, res, next) => {
  try {
    const query = userListQuerySchema.parse(req.query);
    const result = await userService.findAllUsers(
      query.page,
      query.limit,
      query.role,
    );
    sendPaginated(res, result.users, result.total, result.page, result.limit);
  } catch (e) {
    next(e);
  }
};

export const toggleUserActive: TypedHandler<
  IdParam,
  ToggleUserActiveInput
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
