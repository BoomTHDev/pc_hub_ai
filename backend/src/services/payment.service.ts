import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";
import { uploadImage } from "../lib/cloudinary.js";
import { logger } from "../lib/logger.js";
import type {
  PaymentReviewInput,
  PaymentQuery,
} from "../schemas/payment.schema.js";
import type { Prisma, OrderStatus } from "../generated/prisma/client.js";

// List payments with filters
export async function findAll(query: PaymentQuery) {
  const { page, limit, status, method } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.PaymentWhereInput = {};
  if (status) where.status = status;
  if (method) where.method = method;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            grandTotal: true,
            status: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        slips: true,
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, total, page, limit };
}

// Get payment by ID
export async function findById(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        include: {
          items: true,
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
      slips: true,
      reviewedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!payment) throw errors.notFound("Payment not found");
  return payment;
}

// Upload payment slip (customer)
export async function uploadSlip(
  paymentId: string,
  userId: string,
  fileBuffer: Buffer,
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: true,
      slips: {
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!payment) throw errors.notFound("Payment not found");
  if (payment.order.userId !== userId) {
    throw errors.forbidden("This payment does not belong to you");
  }
  if (payment.method !== "PROMPTPAY_QR") {
    throw errors.badRequest("Slip upload is only for PromptPay payments");
  }
  if (payment.status !== "AWAITING_SLIP") {
    throw errors.badRequest(
      "Payment is not in a state that accepts slip uploads",
    );
  }
  if (payment.slips.length > 0) {
    throw errors.conflict("Payment slip already uploaded");
  }

  const uploaded = await uploadImage(fileBuffer, "slips");

  await prisma.$transaction(async (tx) => {
    const claimResult = await tx.payment.updateMany({
      where: { id: payment.id, status: "AWAITING_SLIP" },
      data: { status: "WAITING_REVIEW" },
    });
    if (claimResult.count !== 1) {
      throw errors.conflict("Payment slip already uploaded");
    }

    const existingSlip = await tx.paymentSlip.findFirst({
      where: { paymentId: payment.id },
      select: { id: true },
    });
    if (existingSlip) {
      throw errors.conflict("Payment slip already uploaded");
    }

    await tx.paymentSlip.create({
      data: {
        paymentId: payment.id,
        imageUrl: uploaded.secureUrl,
      },
    });

    await tx.purchaseOrder.update({
      where: { id: payment.orderId },
      data: { status: "WAITING_PAYMENT_REVIEW" },
    });
  });

  logger.info(
    `Slip uploaded for payment ${paymentId}, order ${payment.order.orderNumber}`,
    "PaymentService",
  );

  return findById(paymentId);
}

// Admin: review payment (approve / reject)
export async function reviewPayment(
  paymentId: string,
  reviewerId: string,
  input: PaymentReviewInput,
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });
  if (!payment) throw errors.notFound("Payment not found");
  if (payment.status !== "WAITING_REVIEW") {
    throw errors.badRequest("Payment is not waiting for review");
  }

  if (input.action === "APPROVE") {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "APPROVED",
          paidAt: new Date(),
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          reviewNote: input.reviewNote ?? null,
        },
      });

      await tx.purchaseOrder.update({
        where: { id: payment.orderId },
        data: { status: "CONFIRMED" },
      });
    });

    logger.info(
      `Payment ${paymentId} approved for order ${payment.order.orderNumber}`,
      "PaymentService",
    );
  } else {
    // REJECT
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "REJECTED",
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          reviewNote: input.reviewNote ?? null,
        },
      });

      await tx.purchaseOrder.update({
        where: { id: payment.orderId },
        data: { status: "PAYMENT_REJECTED" },
      });
    });

    logger.info(
      `Payment ${paymentId} rejected for order ${payment.order.orderNumber}`,
      "PaymentService",
    );
  }

  return findById(paymentId);
}

// Admin: mark COD as paid
export async function markCodPaid(
  paymentId: string,
  reviewerId: string,
  note?: string,
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });
  if (!payment) throw errors.notFound("Payment not found");
  if (payment.method !== "COD") {
    throw errors.badRequest("This is not a COD payment");
  }
  if (payment.status !== "COD_PENDING") {
    throw errors.badRequest("COD payment is not in pending state");
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "COD_PAID",
      paidAt: new Date(),
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      reviewNote: note ?? null,
    },
  });

  logger.info(
    `COD payment ${paymentId} marked as paid for order ${payment.order.orderNumber}`,
    "PaymentService",
  );

  return findById(paymentId);
}
