import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signAccessToken, verifyRefreshToken, hashToken } from "../lib/jwt.js";
import { errors } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import {
  createRefreshToken,
  validateRefreshTokenHash,
  revokeRefreshToken,
  revokeAllUserTokens,
} from "./token.service.js";
import type {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  CreateStaffInput,
} from "../schemas/auth.schema.js";
import type { UserRole } from "../generated/prisma/client.js";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

// Register a new customer
export async function register(input: RegisterInput): Promise<{
  user: UserProfile;
  tokens: AuthTokens;
}> {
  // Check for existing email
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw errors.conflict("Email is already registered");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName ?? null,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash,
      role: "CUSTOMER",
    },
  });

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });
  const refreshToken = await createRefreshToken(user.id);

  logger.info(`New customer registered: ${user.email}`, "AuthService");

  return {
    user: toUserProfile(user),
    tokens: { accessToken, refreshToken },
  };
}

// Login (works for all roles)
export async function login(input: LoginInput): Promise<{
  user: UserProfile;
  tokens: AuthTokens;
}> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (!user) {
    throw errors.unauthorized("Invalid email or password");
  }

  if (!user.isActive) {
    throw errors.forbidden("Account has been deactivated");
  }

  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw errors.unauthorized("Invalid email or password");
  }

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });
  const refreshToken = await createRefreshToken(user.id);

  logger.info(`User logged in: ${user.email}`, "AuthService");

  return {
    user: toUserProfile(user),
    tokens: { accessToken, refreshToken },
  };
}

// Refresh access token
export async function refresh(refreshTokenStr: string): Promise<AuthTokens> {
  const decoded = verifyRefreshToken(refreshTokenStr);
  const tokenHash = hashToken(refreshTokenStr);

  const isValid = await validateRefreshTokenHash(decoded.tokenId, tokenHash);
  if (!isValid) {
    throw errors.unauthorized("Invalid or expired refresh token");
  }

  // Get user to verify they still exist and are active
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });
  if (!user || !user.isActive) {
    await revokeRefreshToken(decoded.tokenId);
    throw errors.unauthorized("User account is no longer active");
  }

  // Token rotation: revoke old, issue new
  await revokeRefreshToken(decoded.tokenId);

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });
  const newRefreshToken = await createRefreshToken(user.id);

  return { accessToken, refreshToken: newRefreshToken };
}

// Logout (revoke specific refresh token)
export async function logout(refreshTokenStr: string): Promise<void> {
  try {
    const decoded = verifyRefreshToken(refreshTokenStr);
    await revokeRefreshToken(decoded.tokenId);
  } catch {
    // Silent fail on invalid token — user is already effectively logged out
  }
}

// Logout from all devices
export async function logoutAll(userId: string): Promise<void> {
  await revokeAllUserTokens(userId);
  logger.info(`User logged out from all devices: ${userId}`, "AuthService");
}

// Change password
export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw errors.notFound("User not found");
  }

  const isValid = await verifyPassword(
    input.currentPassword,
    user.passwordHash,
  );
  if (!isValid) {
    throw errors.badRequest("Current password is incorrect");
  }

  const newHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  // Revoke all refresh tokens so user must re-login
  await revokeAllUserTokens(userId);

  logger.info(`Password changed for user: ${userId}`, "AuthService");
}

// Create a staff/admin user (admin only)
export async function createStaffUser(
  input: CreateStaffInput,
): Promise<UserProfile> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw errors.conflict("Email is already registered");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName ?? null,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash,
      role: input.role as UserRole,
    },
  });

  logger.info(
    `New staff user created: ${user.email} (${user.role})`,
    "AuthService",
  );

  return toUserProfile(user);
}

// Get current user profile
export async function getProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw errors.notFound("User not found");
  }
  return toUserProfile(user);
}

// Helper to strip sensitive fields
function toUserProfile(user: {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}): UserProfile {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}
