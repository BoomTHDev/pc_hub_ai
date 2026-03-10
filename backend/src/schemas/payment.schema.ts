import { z } from "zod";

export const paymentReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reviewNote: z.string().max(500).optional(),
});

export const paymentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z
    .enum([
      "AWAITING_SLIP",
      "WAITING_REVIEW",
      "APPROVED",
      "REJECTED",
      "COD_PENDING",
      "COD_PAID",
      "CANCELLED",
    ])
    .optional(),
  method: z.enum(["PROMPTPAY_QR", "COD"]).optional(),
});

export const paymentIdParamSchema = z.object({
  id: z.string().min(1),
});

export const markCodPaidSchema = z.object({
  note: z.string().max(500).optional(),
});

export type PaymentReviewInput = z.infer<typeof paymentReviewSchema>;
export type PaymentQuery = z.infer<typeof paymentQuerySchema>;
export type MarkCodPaidInput = z.infer<typeof markCodPaidSchema>;
