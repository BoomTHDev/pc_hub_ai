import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

// Hash a plain-text password
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

// Verify a plain-text password against a hash
export async function verifyPassword(
  plainText: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
