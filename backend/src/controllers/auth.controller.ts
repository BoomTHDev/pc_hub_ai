import { sendSuccess } from "../lib/response.js";
import type { TypedHandler } from "../lib/typed-request.js";
import * as authService from "../services/auth.service.js";
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
  CreateStaffInput,
} from "../schemas/auth.schema.js";

export const register: TypedHandler<
  Record<string, string>,
  RegisterInput
> = async (req, res, next) => {
  try {
    sendSuccess(res, await authService.register(req.body), 201);
  } catch (e) {
    next(e);
  }
};

export const login: TypedHandler<Record<string, string>, LoginInput> = async (
  req,
  res,
  next,
) => {
  try {
    sendSuccess(res, await authService.login(req.body));
  } catch (e) {
    next(e);
  }
};

export const refreshToken: TypedHandler<
  Record<string, string>,
  RefreshTokenInput
> = async (req, res, next) => {
  try {
    sendSuccess(res, await authService.refresh(req.body.refreshToken));
  } catch (e) {
    next(e);
  }
};

export const logout: TypedHandler<
  Record<string, string>,
  RefreshTokenInput
> = async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    sendSuccess(res, { message: "Logged out successfully" });
  } catch (e) {
    next(e);
  }
};

export const logoutAll: TypedHandler = async (req, res, next) => {
  try {
    await authService.logoutAll(req.user!.userId);
    sendSuccess(res, { message: "Logged out from all devices" });
  } catch (e) {
    next(e);
  }
};

export const changePassword: TypedHandler<
  Record<string, string>,
  ChangePasswordInput
> = async (req, res, next) => {
  try {
    await authService.changePassword(req.user!.userId, req.body);
    sendSuccess(res, { message: "Password changed successfully" });
  } catch (e) {
    next(e);
  }
};

export const getProfile: TypedHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await authService.getProfile(req.user!.userId));
  } catch (e) {
    next(e);
  }
};

export const createStaffUser: TypedHandler<
  Record<string, string>,
  CreateStaffInput
> = async (req, res, next) => {
  try {
    sendSuccess(res, await authService.createStaffUser(req.body), 201);
  } catch (e) {
    next(e);
  }
};
