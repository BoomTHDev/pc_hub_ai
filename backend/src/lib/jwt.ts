import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import type { UserRole } from "../generated/prisma/client.js";

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
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as number,
  });
}

// Sign a refresh token
export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as unknown as number,
  });
}

// Verify and decode an access token
export function verifyAccessToken(token: string): DecodedAccessToken {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as DecodedAccessToken;
}

// Verify and decode a refresh token
export function verifyRefreshToken(token: string): DecodedRefreshToken {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as DecodedRefreshToken;
}

// Hash a refresh token for DB storage
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Parse expiry string to milliseconds (e.g., "7d" -> 604800000)
export function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
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
    throw new Error(`Invalid expiry unit: ${unit}`);
  }
  return value * multiplier;
}

export type {
  AccessTokenPayload,
  RefreshTokenPayload,
  DecodedAccessToken,
  DecodedRefreshToken,
};
