import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";
import { uploadImage, deleteImage } from "../lib/cloudinary.js";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQuery,
} from "../schemas/product.schema.js";
import type { Prisma } from "../generated/prisma/client.js";

// Generate URL-friendly slug from product name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function findAll(query: ProductQuery) {
  const {
    page,
    limit,
    search,
    categoryId,
    brandId,
    minPrice,
    maxPrice,
    isActive,
    sortBy,
    sortOrder,
  } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { description: { contains: search } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (brandId) where.brandId = brandId;
  if (isActive !== undefined) where.isActive = isActive;
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, limit };
}

export async function findById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      attributes: { orderBy: { name: "asc" } },
    },
  });
  if (!product) throw errors.notFound("Product not found");
  return product;
}

export async function findBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      attributes: { orderBy: { name: "asc" } },
    },
  });
  if (!product) throw errors.notFound("Product not found");
  return product;
}

export async function create(input: CreateProductInput) {
  let slug = generateSlug(input.name);

  // Ensure unique slug
  const existingSlug = await prisma.product.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  const { attributes, ...productData } = input;

  return prisma.product.create({
    data: {
      ...productData,
      price: input.price,
      slug,
      description: input.description ?? null,
      attributes: attributes
        ? {
            create: attributes.map((attr) => ({
              name: attr.name,
              value: attr.value,
            })),
          }
        : undefined,
    },
    include: {
      category: true,
      brand: true,
      attributes: true,
      images: true,
    },
  });
}

export async function update(id: string, input: UpdateProductInput) {
  await findById(id);
  return prisma.product.update({
    where: { id },
    data: input,
    include: {
      category: true,
      brand: true,
      attributes: true,
      images: true,
    },
  });
}

export async function remove(id: string) {
  await findById(id);
  // Delete cascades for images and attributes due to onDelete: Cascade
  await prisma.product.delete({ where: { id } });
}

// Product image management
export async function addImage(
  productId: string,
  fileBuffer: Buffer,
  isPrimary: boolean,
) {
  await findById(productId);

  const uploaded = await uploadImage(fileBuffer, "products");

  // Get next sort order
  const lastImage = await prisma.productImage.findFirst({
    where: { productId },
    orderBy: { sortOrder: "desc" },
  });
  const sortOrder = (lastImage?.sortOrder ?? -1) + 1;

  // If isPrimary, unset other primary images
  if (isPrimary) {
    await prisma.productImage.updateMany({
      where: { productId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  return prisma.productImage.create({
    data: {
      productId,
      imageUrl: uploaded.secureUrl,
      sortOrder,
      isPrimary,
    },
  });
}

export async function removeImage(productId: string, imageId: string) {
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });
  if (!image) throw errors.notFound("Image not found");

  // Extract public ID from URL for Cloudinary deletion
  const urlParts = image.imageUrl.split("/");
  const publicIdWithExt = urlParts.slice(-2).join("/");
  const publicId = publicIdWithExt.replace(/\.[^.]+$/, "");
  await deleteImage(publicId);

  await prisma.productImage.delete({ where: { id: imageId } });
}

// Update product attributes
export async function updateAttributes(
  productId: string,
  attributes: Array<{ name: string; value: string }>,
) {
  await findById(productId);

  // Delete existing and recreate
  await prisma.productAttribute.deleteMany({ where: { productId } });
  await prisma.productAttribute.createMany({
    data: attributes.map((attr) => ({
      productId,
      name: attr.name,
      value: attr.value,
    })),
  });

  return prisma.productAttribute.findMany({
    where: { productId },
    orderBy: { name: "asc" },
  });
}
