import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL ?? "");
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data (reverse order of dependencies)
  await prisma.paymentSlip.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productAttribute.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing data");

  // Create admin user
  const adminHash = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "PC Hub",
      email: "admin@pchub.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log(`👤 Admin created: ${admin.email}`);

  // Create staff user
  const staffHash = await bcrypt.hash("Staff@123", 12);
  const staff = await prisma.user.create({
    data: {
      firstName: "Staff",
      lastName: "Member",
      email: "staff@pchub.com",
      passwordHash: staffHash,
      role: "STAFF",
    },
  });
  console.log(`👤 Staff created: ${staff.email}`);

  // Create customer user
  const customerHash = await bcrypt.hash("Customer@123", 12);
  const customer = await prisma.user.create({
    data: {
      firstName: "John",
      lastName: "Doe",
      email: "customer@pchub.com",
      phone: "0891234567",
      passwordHash: customerHash,
      role: "CUSTOMER",
    },
  });
  console.log(`👤 Customer created: ${customer.email}`);

  // Create customer address
  await prisma.userAddress.create({
    data: {
      userId: customer.id,
      type: "HOME",
      label: "บ้าน",
      recipientName: "John Doe",
      recipientPhone: "0891234567",
      line1: "123/45 ถนนสุขุมวิท",
      subDistrict: "คลองเตย",
      district: "คลองเตย",
      province: "กรุงเทพมหานคร",
      postalCode: "10110",
      isDefault: true,
    },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "CPU / Processors",
        description: "Central Processing Units from Intel and AMD",
      },
    }),
    prisma.category.create({
      data: {
        name: "Graphics Cards",
        description: "Dedicated GPUs for gaming and workstations",
      },
    }),
    prisma.category.create({
      data: {
        name: "Motherboards",
        description: "Mainboards for various CPU platforms",
      },
    }),
    prisma.category.create({
      data: {
        name: "Memory / RAM",
        description: "DDR4 and DDR5 memory modules",
      },
    }),
    prisma.category.create({
      data: { name: "Storage", description: "SSDs, HDDs, and NVMe drives" },
    }),
    prisma.category.create({
      data: {
        name: "Power Supplies",
        description: "ATX and SFX power supply units",
      },
    }),
    prisma.category.create({
      data: { name: "Cases", description: "PC cases in various form factors" },
    }),
    prisma.category.create({
      data: {
        name: "Monitors",
        description: "Gaming and professional displays",
      },
    }),
    prisma.category.create({
      data: {
        name: "Peripherals",
        description: "Keyboards, mice, headsets, and more",
      },
    }),
    prisma.category.create({
      data: {
        name: "Cooling",
        description: "Air coolers, AIO liquid coolers, and fans",
      },
    }),
  ]);
  console.log(`📂 ${categories.length} categories created`);

  // Create brands
  const brands = await Promise.all([
    prisma.brand.create({
      data: {
        name: "Intel",
        description: "World leader in semiconductor innovation",
        website: "https://intel.com",
      },
    }),
    prisma.brand.create({
      data: {
        name: "AMD",
        description: "Advanced Micro Devices",
        website: "https://amd.com",
      },
    }),
    prisma.brand.create({
      data: {
        name: "NVIDIA",
        description: "Gaming and AI GPU leader",
        website: "https://nvidia.com",
      },
    }),
    prisma.brand.create({
      data: {
        name: "ASUS",
        description: "In Search of Incredible",
        website: "https://asus.com",
      },
    }),
    prisma.brand.create({
      data: {
        name: "MSI",
        description: "True Gaming",
        website: "https://msi.com",
      },
    }),
    prisma.brand.create({
      data: {
        name: "Corsair",
        description: "Game On",
        website: "https://corsair.com",
      },
    }),
    prisma.brand.create({
      data: {
        name: "Samsung",
        description: "Inspire the World, Create the Future",
        website: "https://samsung.com",
      },
    }),
    prisma.brand.create({
      data: {
        name: "Gigabyte",
        description: "Upgrade Your Life",
        website: "https://gigabyte.com",
      },
    }),
    prisma.brand.create({
      data: {
        name: "Kingston",
        description: "Memory and storage solutions",
        website: "https://kingston.com",
      },
    }),
    prisma.brand.create({
      data: {
        name: "Seasonic",
        description: "Premium power supply manufacturer",
        website: "https://seasonic.com",
      },
    }),
  ]);
  console.log(`🏷️ ${brands.length} brands created`);

  // Helper to find category/brand by name
  const cat = (name: string) => categories.find((c) => c.name === name)!;
  const brand = (name: string) => brands.find((b) => b.name === name)!;

  // Create products with attributes
  const productsData = [
    {
      sku: "CPU-INTEL-I7-14700K",
      name: "Intel Core i7-14700K Processor",
      description:
        "20 cores (8P+12E), 33MB Cache, up to 5.6 GHz. Unlocked desktop processor for gaming and content creation.",
      price: 13990,
      stockQty: 25,
      categoryId: cat("CPU / Processors").id,
      brandId: brand("Intel").id,
      attributes: [
        { name: "Cores", value: "20 (8P+12E)" },
        { name: "Base Clock", value: "3.4 GHz" },
        { name: "Boost Clock", value: "5.6 GHz" },
        { name: "Socket", value: "LGA 1700" },
        { name: "TDP", value: "125W" },
      ],
    },
    {
      sku: "CPU-AMD-R7-7800X3D",
      name: "AMD Ryzen 7 7800X3D Processor",
      description:
        "8 cores, 16 threads, 3D V-Cache technology. The best gaming CPU with AM5 platform.",
      price: 12490,
      stockQty: 15,
      categoryId: cat("CPU / Processors").id,
      brandId: brand("AMD").id,
      attributes: [
        { name: "Cores", value: "8" },
        { name: "Threads", value: "16" },
        { name: "Base Clock", value: "4.2 GHz" },
        { name: "Boost Clock", value: "5.0 GHz" },
        { name: "Socket", value: "AM5" },
        { name: "L3 Cache", value: "96 MB (3D V-Cache)" },
      ],
    },
    {
      sku: "GPU-NV-RTX4070TI-SUPER",
      name: "ASUS TUF Gaming GeForce RTX 4070 Ti SUPER 16GB",
      description:
        "16GB GDDR6X, 8448 CUDA Cores. Triple-fan cooler with military-grade capacitors.",
      price: 28990,
      stockQty: 10,
      categoryId: cat("Graphics Cards").id,
      brandId: brand("ASUS").id,
      attributes: [
        { name: "GPU Chip", value: "NVIDIA RTX 4070 Ti SUPER" },
        { name: "Memory", value: "16GB GDDR6X" },
        { name: "Memory Bus", value: "256-bit" },
        { name: "Boost Clock", value: "2640 MHz" },
        { name: "Power Connector", value: "1x 16-pin" },
      ],
    },
    {
      sku: "GPU-NV-RTX4060TI",
      name: "MSI GeForce RTX 4060 Ti VENTUS 2X 8GB",
      description:
        "8GB GDDR6, 4352 CUDA Cores. Dual-fan cooling, compact design.",
      price: 14990,
      stockQty: 20,
      categoryId: cat("Graphics Cards").id,
      brandId: brand("MSI").id,
      attributes: [
        { name: "GPU Chip", value: "NVIDIA RTX 4060 Ti" },
        { name: "Memory", value: "8GB GDDR6" },
        { name: "Power", value: "160W TDP" },
      ],
    },
    {
      sku: "MB-ASUS-Z790-HERO",
      name: "ASUS ROG Maximus Z790 HERO",
      description:
        "Intel Z790 chipset, DDR5, PCIe 5.0 x16, WiFi 6E, 2.5G LAN. Premium LGA1700 motherboard.",
      price: 22990,
      stockQty: 8,
      categoryId: cat("Motherboards").id,
      brandId: brand("ASUS").id,
      attributes: [
        { name: "Chipset", value: "Intel Z790" },
        { name: "Socket", value: "LGA 1700" },
        { name: "Form Factor", value: "ATX" },
        { name: "Memory Type", value: "DDR5" },
      ],
    },
    {
      sku: "RAM-CORS-32GB-DDR5",
      name: "Corsair Vengeance DDR5 32GB (2x16GB) 6000MHz",
      description:
        "DDR5 32GB kit, CL30, Intel XMP 3.0 ready. Optimized for the latest Intel and AMD platforms.",
      price: 4290,
      stockQty: 50,
      categoryId: cat("Memory / RAM").id,
      brandId: brand("Corsair").id,
      attributes: [
        { name: "Capacity", value: "32GB (2x16GB)" },
        { name: "Speed", value: "DDR5-6000" },
        { name: "CAS Latency", value: "CL30" },
        { name: "Voltage", value: "1.35V" },
      ],
    },
    {
      sku: "SSD-SAM-990PRO-2TB",
      name: "Samsung 990 PRO 2TB NVMe M.2 SSD",
      description:
        "PCIe Gen 4.0 x4, up to 7,450 MB/s read. Premium consumer NVMe SSD with excellent endurance.",
      price: 6490,
      stockQty: 30,
      categoryId: cat("Storage").id,
      brandId: brand("Samsung").id,
      attributes: [
        { name: "Capacity", value: "2TB" },
        { name: "Interface", value: "PCIe 4.0 x4 NVMe" },
        { name: "Read Speed", value: "7,450 MB/s" },
        { name: "Write Speed", value: "6,900 MB/s" },
        { name: "Form Factor", value: "M.2 2280" },
      ],
    },
    {
      sku: "PSU-SEA-FOCUS-850",
      name: "Seasonic FOCUS GX-850 850W 80+ Gold",
      description:
        "Fully modular, 80 PLUS Gold certified. Hybrid fan control, premium Japanese capacitors. 10-year warranty.",
      price: 4990,
      stockQty: 18,
      categoryId: cat("Power Supplies").id,
      brandId: brand("Seasonic").id,
      attributes: [
        { name: "Wattage", value: "850W" },
        { name: "Efficiency", value: "80+ Gold" },
        { name: "Modular", value: "Fully Modular" },
        { name: "Fan Size", value: "120mm" },
      ],
    },
  ];

  for (const pData of productsData) {
    const slug = pData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    const { attributes, ...productFields } = pData;
    const product = await prisma.product.create({
      data: {
        ...productFields,
        slug,
        attributes: {
          create: attributes,
        },
      },
    });

    // Create initial inventory transaction (restock)
    await prisma.inventoryTransaction.create({
      data: {
        productId: product.id,
        type: "RESTOCK",
        quantity: pData.stockQty,
        note: "Initial stock",
      },
    });
  }

  console.log(
    `📦 ${productsData.length} products created with attributes and inventory`,
  );
  console.log("");
  console.log("✅ Seed completed!");
  console.log("");
  console.log("📧 Test accounts:");
  console.log("   Admin:    admin@pchub.com    / Admin@123");
  console.log("   Staff:    staff@pchub.com    / Staff@123");
  console.log("   Customer: customer@pchub.com / Customer@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
