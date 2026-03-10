import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../schemas/category.schema.js";

export async function findAll() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function findById(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) throw errors.notFound("Category not found");
  return category;
}

export async function create(input: CreateCategoryInput) {
  return prisma.category.create({
    data: {
      name: input.name,
      description: input.description ?? null,
    },
  });
}

export async function update(id: string, input: UpdateCategoryInput) {
  await findById(id);
  return prisma.category.update({
    where: { id },
    data: input,
  });
}

export async function remove(id: string) {
  const category = await findById(id);
  const productCount = category._count.products;
  if (productCount > 0) {
    throw errors.conflict(
      "Cannot delete category with existing products. Remove products first.",
    );
  }
  await prisma.category.delete({ where: { id } });
}
