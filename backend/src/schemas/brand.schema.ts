import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional(),
});

export const updateBrandSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
  website: z.string().url().nullable().optional(),
});

export const brandIdParamSchema = z.object({
  id: z.string().min(1),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
