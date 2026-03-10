import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";
import type {
  UpdateProfileInput,
  CreateAddressInput,
  UpdateAddressInput,
} from "../schemas/user.schema.js";
import type { AddressType } from "../generated/prisma/client.js";

// Update user profile
export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw errors.notFound("User not found");

  return prisma.user.update({
    where: { id: userId },
    data: input,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });
}

// ─── Address Management ──────────────────────────────────────────────

export async function getAddresses(userId: string) {
  return prisma.userAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function getAddressById(userId: string, addressId: string) {
  const address = await prisma.userAddress.findFirst({
    where: { id: addressId, userId },
  });
  if (!address) throw errors.notFound("Address not found");
  return address;
}

export async function createAddress(userId: string, input: CreateAddressInput) {
  // If setting as default, unset existing default
  if (input.isDefault) {
    await prisma.userAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.userAddress.create({
    data: {
      userId,
      type: (input.type ?? "HOME") as AddressType,
      label: input.label ?? null,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      line1: input.line1,
      line2: input.line2 ?? null,
      subDistrict: input.subDistrict ?? null,
      district: input.district ?? null,
      province: input.province,
      postalCode: input.postalCode,
      isDefault: input.isDefault,
    },
  });
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: UpdateAddressInput,
) {
  await getAddressById(userId, addressId);

  // If setting as default, unset existing default
  if (input.isDefault) {
    await prisma.userAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.userAddress.update({
    where: { id: addressId },
    data: input,
  });
}

export async function deleteAddress(userId: string, addressId: string) {
  await getAddressById(userId, addressId);
  await prisma.userAddress.delete({ where: { id: addressId } });
}

// Admin: list all users
export async function findAllUsers(page = 1, limit = 20, role?: string) {
  const skip = (page - 1) * limit;
  const where = role ? { role: role as "ADMIN" | "STAFF" | "CUSTOMER" } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
}

// Admin: toggle user active status
export async function toggleUserActive(userId: string, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw errors.notFound("User not found");

  return prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
    },
  });
}
