import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import type {
  CheckoutInput,
  OrderQuery,
  UpdateOrderStatusInput,
} from "../schemas/order.schema.js";
import type {
  Prisma,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../generated/prisma/client.js";

// Generate unique order number
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PCH-${year}${month}${day}-${random}`;
}

// Atomic checkout: validate stock → create order → deduct stock → log inventory → update cart
export async function checkout(userId: string, input: CheckoutInput) {
  // Get shipping address
  const address = await prisma.userAddress.findFirst({
    where: { id: input.addressId, userId },
  });
  if (!address) throw errors.notFound("Shipping address not found");

  // Get active cart with items
  const cart = await prisma.cart.findFirst({
    where: { userId, status: "ACTIVE" },
    include: {
      items: {
        include: { product: true },
      },
    },
  });
  if (!cart || cart.items.length === 0) {
    throw errors.badRequest("Cart is empty");
  }

  // Validate all products are active and in stock
  for (const item of cart.items) {
    if (!item.product.isActive) {
      throw errors.badRequest(
        `Product "${item.product.name}" is no longer available`,
      );
    }
    if (item.product.stockQty < item.quantity) {
      throw errors.badRequest(
        `Insufficient stock for "${item.product.name}". Available: ${item.product.stockQty}, Requested: ${item.quantity}`,
      );
    }
  }

  const orderNumber = generateOrderNumber();
  const shippingFee = 0; // Free shipping for now
  let subTotal = 0;

  for (const item of cart.items) {
    subTotal += Number(item.unitPrice) * item.quantity;
  }
  const grandTotal = subTotal + shippingFee;

  // Build shipping address string
  const addressParts = [
    address.line1,
    address.line2,
    address.subDistrict,
    address.district,
    address.province,
    address.postalCode,
  ].filter(Boolean);
  const shippingAddress = addressParts.join(", ");

  // Determine payment status based on method
  const paymentMethod: PaymentMethod =
    input.paymentMethod === "PROMPTPAY_QR" ? "PROMPTPAY_QR" : "COD";
  const paymentStatus: PaymentStatus =
    paymentMethod === "PROMPTPAY_QR" ? "AWAITING_SLIP" : "COD_PENDING";
  const orderStatus: OrderStatus =
    paymentMethod === "COD" ? "CONFIRMED" : "PENDING_PAYMENT";

  // Atomic transaction
  const order = await prisma.$transaction(async (tx) => {
    // Re-validate stock within transaction
    for (const item of cart.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      if (!product || product.stockQty < item.quantity) {
        throw errors.badRequest(
          `Stock changed for "${item.product.name}". Please review your cart.`,
        );
      }
    }

    // Create order
    const newOrder = await tx.purchaseOrder.create({
      data: {
        orderNumber,
        userId,
        status: orderStatus,
        subTotal,
        shippingFee,
        grandTotal,
        recipientName: address.recipientName,
        recipientPhone: address.recipientPhone,
        shippingAddress,
        note: input.note ?? null,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productSku: item.product.sku,
            productName: item.product.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineTotal: Number(item.unitPrice) * item.quantity,
          })),
        },
        payment: {
          create: {
            method: paymentMethod,
            status: paymentStatus,
            amount: grandTotal,
          },
        },
      },
      include: {
        items: true,
        payment: true,
      },
    });

    // Deduct stock and create inventory logs
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } },
      });

      await tx.inventoryTransaction.create({
        data: {
          productId: item.productId,
          type: "SALE",
          quantity: -item.quantity,
          referenceId: newOrder.id,
          note: `Order ${orderNumber}`,
        },
      });
    }

    // Mark cart as checked out
    await tx.cart.update({
      where: { id: cart.id },
      data: { status: "CHECKED_OUT" },
    });

    return newOrder;
  });

  logger.info(`Order created: ${orderNumber}`, "OrderService", { userId });

  return order;
}

// Get orders with pagination and filters
export async function findAll(query: OrderQuery, userId?: string) {
  const { page, limit, status } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.PurchaseOrderWhereInput = {};
  if (userId) where.userId = userId;
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
        payment: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return { orders, total, page, limit };
}

// Get single order by ID
export async function findById(orderId: string, userId?: string) {
  const where: Prisma.PurchaseOrderWhereInput = { id: orderId };
  if (userId) where.userId = userId;

  const order = await prisma.purchaseOrder.findFirst({
    where,
    include: {
      items: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
        },
      },
      payment: { include: { slips: true } },
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
  if (!order) throw errors.notFound("Order not found");
  return order;
}

// Admin: update order status
export async function updateStatus(
  orderId: string,
  input: UpdateOrderStatusInput,
  adminUserId: string,
) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order) throw errors.notFound("Order not found");

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    PENDING_PAYMENT: ["CANCELLED"],
    WAITING_PAYMENT_REVIEW: ["CANCELLED"],
    PAYMENT_REJECTED: ["CANCELLED"],
    CONFIRMED: ["PREPARING", "CANCELLED"],
    PREPARING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  const allowed = validTransitions[order.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw errors.badRequest(
      `Cannot transition from ${order.status} to ${input.status}`,
    );
  }

  // If cancelling, restore stock
  if (input.status === "CANCELLED") {
    await prisma.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({
        where: { orderId },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity } },
        });

        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            type: "RETURN_IN",
            quantity: item.quantity,
            referenceId: orderId,
            note: `Order ${order.orderNumber} cancelled`,
          },
        });
      }

      await tx.purchaseOrder.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      // Cancel payment too
      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "CANCELLED" },
        });
      }
    });

    logger.info(`Order cancelled: ${order.orderNumber}`, "OrderService");
    return findById(orderId);
  }

  // Update COD payment when delivered
  if (input.status === "DELIVERED" && order.payment?.method === "COD") {
    await prisma.payment.update({
      where: { id: order.payment.id },
      data: { status: "COD_PAID", paidAt: new Date() },
    });
  }

  await prisma.purchaseOrder.update({
    where: { id: orderId },
    data: { status: input.status as OrderStatus },
  });

  logger.info(
    `Order ${order.orderNumber} status: ${order.status} → ${input.status}`,
    "OrderService",
  );

  return findById(orderId);
}
