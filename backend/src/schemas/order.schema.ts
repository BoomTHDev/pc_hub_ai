import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.string().min(1, "Shipping address is required"),
  paymentMethod: z.enum(["PROMPTPAY_QR", "COD"]),
  note: z.string().max(500).optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z
    .enum([
      "PENDING_PAYMENT",
      "WAITING_PAYMENT_REVIEW",
      "PAYMENT_REJECTED",
      "CONFIRMED",
      "PREPARING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ])
    .optional(),
});

export const orderIdParamSchema = z.object({
  id: z.string().min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "CONFIRMED",
    "PREPARING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
