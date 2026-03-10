import { prisma } from "../lib/prisma.js";
import { errors } from "../lib/errors.js";
import type {
  CreateBrandInput,
  UpdateBrandInput,
} from "../schemas/brand.schema.js";

export async function findAll() {
  return prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function findById(id: string) {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!brand) throw errors.notFound("Brand not found");
  return brand;
}

export async function create(input: CreateBrandInput) {
  return prisma.brand.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      website: input.website ?? null,
    },
  });
}

export async function update(id: string, input: UpdateBrandInput) {
  await findById(id);
  return prisma.brand.update({ where: { id }, data: input });
}

export async function remove(id: string) {
  const brand = await findById(id);
  const productCount = brand._count.products;
  if (productCount > 0) {
    throw errors.conflict(
      "Cannot delete brand with existing products. Remove products first.",
    );
  }
  await prisma.brand.delete({ where: { id } });
}
