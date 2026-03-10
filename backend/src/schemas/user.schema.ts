import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).nullable().optional(),
  phone: z.string().min(9).max(15).nullable().optional(),
});

export const createAddressSchema = z.object({
  type: z.enum(["HOME", "WORK", "OTHER"]).default("HOME"),
  label: z.string().max(50).optional(),
  recipientName: z.string().min(1, "Recipient name is required").max(100),
  recipientPhone: z.string().min(9).max(15),
  line1: z.string().min(1, "Address line 1 is required").max(200),
  line2: z.string().max(200).optional(),
  subDistrict: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  province: z.string().min(1, "Province is required").max(100),
  postalCode: z.string().min(5).max(10),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = z.object({
  type: z.enum(["HOME", "WORK", "OTHER"]).optional(),
  label: z.string().max(50).nullable().optional(),
  recipientName: z.string().min(1).max(100).optional(),
  recipientPhone: z.string().min(9).max(15).optional(),
  line1: z.string().min(1).max(200).optional(),
  line2: z.string().max(200).nullable().optional(),
  subDistrict: z.string().max(100).nullable().optional(),
  district: z.string().max(100).nullable().optional(),
  province: z.string().min(1).max(100).optional(),
  postalCode: z.string().min(5).max(10).optional(),
  isDefault: z.boolean().optional(),
});

export const addressIdParamSchema = z.object({
  id: z.string().min(1),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
