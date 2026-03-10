import { z } from "zod";

export const createProductSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(50),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().positive("Price must be positive"),
  stockQty: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().min(1, "Brand is required"),
  attributes: z
    .array(z.object({ name: z.string().min(1), value: z.string().min(1) }))
    .optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  price: z.coerce.number().positive().optional(),
  stockQty: z.coerce.number().int().min(0).optional(),
  isActive: z.coerce.boolean().optional(),
  categoryId: z.string().min(1).optional(),
  brandId: z.string().min(1).optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sortBy: z.enum(["name", "price", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const productIdParamSchema = z.object({
  id: z.string().min(1),
});

export const productSlugParamSchema = z.object({
  slug: z.string().min(1),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
