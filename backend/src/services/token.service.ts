import { prisma } from "../lib/prisma.js";
import { hashToken, parseExpiryToMs, signRefreshToken } from "../lib/jwt.js";
import { env } from "../config/env.js";

// Create a new refresh token and store its hash in DB
export async function createRefreshToken(userId: string): Promise<string> {
  const tokenId = crypto.randomUUID();
  const token = signRefreshToken({ userId, tokenId });
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN),
  );

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return token;
}

// Validate a refresh token hash exists and is not expired
export async function validateRefreshTokenHash(
  tokenId: string,
  tokenHash: string,
): Promise<boolean> {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { id: tokenId },
  });

  if (!storedToken) return false;
  if (storedToken.tokenHash !== tokenHash) return false;
  if (storedToken.expiresAt < new Date()) {
    // Clean up expired token
    await prisma.refreshToken.delete({ where: { id: tokenId } });
    return false;
  }

  return true;
}

// Revoke a specific refresh token by its ID
export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { id: tokenId },
  });
}

// Revoke all refresh tokens for a user (logout from all devices)
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

// Clean up expired tokens (can be called periodically)
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
