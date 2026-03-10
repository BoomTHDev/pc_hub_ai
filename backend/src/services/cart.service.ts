import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";
import type {
  AddToCartInput,
  UpdateCartItemInput,
} from "../schemas/cart.schema.js";

// Get or create active cart for a user
async function getOrCreateActiveCart(userId: string) {
  let cart = await prisma.cart.findFirst({
    where: { userId, status: "ACTIVE" },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });
  }

  return cart;
}

export async function getCart(userId: string) {
  const cart = await getOrCreateActiveCart(userId);

  // Calculate totals
  let itemCount = 0;
  let subTotal = 0;

  for (const item of cart.items) {
    itemCount += item.quantity;
    subTotal += Number(item.unitPrice) * item.quantity;
  }

  return { ...cart, itemCount, subTotal };
}

export async function addItem(userId: string, input: AddToCartInput) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });
  if (!product) throw errors.notFound("Product not found");
  if (!product.isActive) throw errors.badRequest("Product is not available");
  if (product.stockQty < input.quantity) {
    throw errors.badRequest(
      `Insufficient stock. Available: ${product.stockQty}`,
    );
  }

  const cart = await getOrCreateActiveCart(userId);

  // Check if product already in cart
  const existingItem = cart.items.find(
    (item) => item.productId === input.productId,
  );

  if (existingItem) {
    const newQty = existingItem.quantity + input.quantity;
    if (newQty > product.stockQty) {
      throw errors.badRequest(
        `Cannot add ${input.quantity} more. Stock: ${product.stockQty}, In cart: ${existingItem.quantity}`,
      );
    }
    await prisma.cartItem.update({
      where: {
        cartId_productId: { cartId: cart.id, productId: input.productId },
      },
      data: { quantity: newQty, unitPrice: product.price },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        quantity: input.quantity,
        unitPrice: product.price,
      },
    });
  }

  return getCart(userId);
}

export async function updateItemQuantity(
  userId: string,
  productId: string,
  input: UpdateCartItemInput,
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) throw errors.notFound("Product not found");
  if (input.quantity > product.stockQty) {
    throw errors.badRequest(
      `Insufficient stock. Available: ${product.stockQty}`,
    );
  }

  const cart = await getOrCreateActiveCart(userId);
  const existingItem = cart.items.find((item) => item.productId === productId);
  if (!existingItem) {
    throw errors.notFound("Item not found in cart");
  }

  await prisma.cartItem.update({
    where: {
      cartId_productId: { cartId: cart.id, productId },
    },
    data: { quantity: input.quantity, unitPrice: product.price },
  });

  return getCart(userId);
}

export async function removeItem(userId: string, productId: string) {
  const cart = await getOrCreateActiveCart(userId);
  const existingItem = cart.items.find((item) => item.productId === productId);
  if (!existingItem) {
    throw errors.notFound("Item not found in cart");
  }

  await prisma.cartItem.delete({
    where: {
      cartId_productId: { cartId: cart.id, productId },
    },
  });

  return getCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await prisma.cart.findFirst({
    where: { userId, status: "ACTIVE" },
  });
  if (!cart) return;

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}
