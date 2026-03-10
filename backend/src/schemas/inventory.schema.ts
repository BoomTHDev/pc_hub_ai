import { z } from "zod";

export const createInventoryTransactionSchema = z.object({
  productId: z.string().min(1),
  type: z.enum([
    "RESTOCK",
    "ADJUSTMENT_IN",
    "ADJUSTMENT_OUT",
    "RETURN_IN",
    "RETURN_OUT",
  ]),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  note: z.string().max(500).optional(),
});

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  productId: z.string().optional(),
  type: z
    .enum([
      "RESTOCK",
      "SALE",
      "ADJUSTMENT_IN",
      "ADJUSTMENT_OUT",
      "RETURN_IN",
      "RETURN_OUT",
    ])
    .optional(),
});

export type CreateInventoryTransactionInput = z.infer<
  typeof createInventoryTransactionSchema
>;
export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;
