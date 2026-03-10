import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { errors } from "./errors.js";
import type { UserRole } from "../generated/prisma/client.js";
import type { JwtPayload } from "jsonwebtoken";

// JWT payload for access tokens
interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  email: string;
}

// JWT payload for refresh tokens
interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

// Decoded access token (includes JWT standard fields)
interface DecodedAccessToken extends AccessTokenPayload {
  iat: number;
  exp: number;
}

interface DecodedRefreshToken extends RefreshTokenPayload {
  iat: number;
  exp: number;
}

// Sign an access token
export function signAccessToken(payload: AccessTokenPayload): string {
  const expiresInSeconds = parseExpiryToSeconds(env.JWT_ACCESS_EXPIRES_IN);
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: expiresInSeconds,
  });
}

// Sign a refresh token
export function signRefreshToken(payload: RefreshTokenPayload): string {
  const expiresInSeconds = parseExpiryToSeconds(env.JWT_REFRESH_EXPIRES_IN);
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: expiresInSeconds,
  });
}

function isUserRole(value: string): value is UserRole {
  return value === "ADMIN" || value === "STAFF" || value === "CUSTOMER";
}

function readBasePayload(
  decoded: string | JwtPayload,
  tokenType: "access" | "refresh",
): { userId: string; iat: number; exp: number } & JwtPayload {
  if (typeof decoded === "string") {
    throw errors.unauthorized(`Invalid ${tokenType} token payload`);
  }

  const userId = decoded.userId;
  const iat = decoded.iat;
  const exp = decoded.exp;

  if (
    typeof userId !== "string" ||
    typeof iat !== "number" ||
    typeof exp !== "number"
  ) {
    throw errors.unauthorized(`Invalid ${tokenType} token payload`);
  }

  return {
    userId,
    iat,
    exp,
    ...decoded,
  };
}

function readAccessPayload(decoded: string | JwtPayload): DecodedAccessToken {
  const payload = readBasePayload(decoded, "access");
  const email = payload.email;
  const role = payload.role;

  if (typeof email !== "string" || typeof role !== "string" || !isUserRole(role)) {
    throw errors.unauthorized("Invalid access token payload");
  }

  return {
    userId: payload.userId,
    email,
    role,
    iat: payload.iat,
    exp: payload.exp,
  };
}

function readRefreshPayload(decoded: string | JwtPayload): DecodedRefreshToken {
  const payload = readBasePayload(decoded, "refresh");
  const tokenId = payload.tokenId;

  if (typeof tokenId !== "string") {
    throw errors.unauthorized("Invalid refresh token payload");
  }

  return {
    userId: payload.userId,
    tokenId,
    iat: payload.iat,
    exp: payload.exp,
  };
}

// Verify and decode an access token
export function verifyAccessToken(token: string): DecodedAccessToken {
  return readAccessPayload(jwt.verify(token, env.JWT_ACCESS_SECRET));
}

// Verify and decode a refresh token
export function verifyRefreshToken(token: string): DecodedRefreshToken {
  return readRefreshPayload(jwt.verify(token, env.JWT_REFRESH_SECRET));
}

// Hash a refresh token for DB storage
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Parse expiry string to milliseconds (e.g., "7d" -> 604800000)
export function parseExpiryToMs(expiry: string): number {
  const normalized = expiry.trim().toLowerCase();

  if (/^\d+$/.test(normalized)) {
    return Number.parseInt(normalized, 10) * 1000;
  }

  const match = normalized.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw errors.internal(`Invalid expiry format: ${expiry}`);
  }
  const value = parseInt(match[1] ?? "0", 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  const multiplier = multipliers[unit ?? ""];
  if (multiplier === undefined) {
    throw errors.internal(`Invalid expiry unit: ${unit}`);
  }
  return value * multiplier;
}

export function parseExpiryToSeconds(expiry: string): number {
  return Math.floor(parseExpiryToMs(expiry) / 1000);
}

export type {
  AccessTokenPayload,
  RefreshTokenPayload,
  DecodedAccessToken,
  DecodedRefreshToken,
};
