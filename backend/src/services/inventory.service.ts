import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import type {
  CreateInventoryTransactionInput,
  InventoryQuery,
} from "../schemas/inventory.schema.js";
import type {
  Prisma,
  InventoryTransactionType,
} from "../generated/prisma/client.js";

// Types that increase stock
const STOCK_IN_TYPES: InventoryTransactionType[] = [
  "RESTOCK",
  "ADJUSTMENT_IN",
  "RETURN_IN",
];
// Types that decrease stock
const STOCK_OUT_TYPES: InventoryTransactionType[] = [
  "ADJUSTMENT_OUT",
  "RETURN_OUT",
];

export async function createTransaction(
  input: CreateInventoryTransactionInput,
) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });
  if (!product) throw errors.notFound("Product not found");

  const type: InventoryTransactionType = input.type;

  // Determine stock change direction
  let stockChange: number;
  if (STOCK_IN_TYPES.includes(type)) {
    stockChange = input.quantity;
  } else if (STOCK_OUT_TYPES.includes(type)) {
    if (product.stockQty < input.quantity) {
      throw errors.badRequest(
        `Insufficient stock. Available: ${product.stockQty}, Requested: ${input.quantity}`,
      );
    }
    stockChange = -input.quantity;
  } else {
    throw errors.badRequest(`Invalid transaction type: ${type}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.inventoryTransaction.create({
      data: {
        productId: input.productId,
        type,
        quantity: stockChange,
        note: input.note ?? null,
      },
    });

    await tx.product.update({
      where: { id: input.productId },
      data: {
        stockQty: { increment: stockChange },
      },
    });

    return transaction;
  });

  logger.info(
    `Inventory ${type}: product ${product.sku}, qty ${stockChange}`,
    "InventoryService",
  );

  return result;
}

export async function findAll(query: InventoryQuery) {
  const { page, limit, productId, type } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.InventoryTransactionWhereInput = {};
  if (productId) where.productId = productId;
  if (type) where.type = type;

  const [transactions, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: { id: true, sku: true, name: true, stockQty: true },
        },
      },
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);

  return { transactions, total, page, limit };
}

// Get low stock products
export async function getLowStockProducts(threshold = 10) {
  return prisma.product.findMany({
    where: { stockQty: { lte: threshold }, isActive: true },
    orderBy: { stockQty: "asc" },
    select: { id: true, sku: true, name: true, stockQty: true },
  });
}
