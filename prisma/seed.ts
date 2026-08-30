import type { BaseUnit, MeasurementType } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/modules/identity/password";

const prisma = new PrismaClient();

const initialBranches = ["Alvorada 1", "Alvorada 2"];

type SeedCategory = {
  description: string;
  name: string;
  slug: string;
  sortOrder: number;
};

type SeedProduct = {
  baseUnit: BaseUnit;
  categorySlug: string;
  description: string;
  measurementType: MeasurementType;
  minimumOrderQuantity: number;
  name: string;
  priceCents?: number;
  priceBasisQuantity?: number;
  priceBasisUnit?: BaseUnit;
  sellingIncrement: number;
  slug: string;
};

async function main() {
  const business = await prisma.business.upsert({
    where: { id: "business_deliveryreg_manaus" },
    update: {},
    create: {
      id: "business_deliveryreg_manaus",
      name: "DeliveryReg Manaus",
      timezone: "America/Manaus",
    },
  });

  const branches = await Promise.all(
    initialBranches.map((name) =>
      prisma.branch.upsert({
        where: {
          businessId_name: {
            businessId: business.id,
            name,
          },
        },
        update: {
          isActive: true,
        },
        create: {
          businessId: business.id,
          name,
        },
      }),
    ),
  );

  const owner = await prisma.user.upsert({
    where: {
      businessId_email: {
        businessId: business.id,
        email: "admin@deliveryreg.local",
      },
    },
    update: {
      isActive: true,
      role: "OWNER",
    },
    create: {
      businessId: business.id,
      email: "admin@deliveryreg.local",
      name: "Administrador",
      role: "OWNER",
      passwordHash: await hashPassword("troque-esta-senha"),
    },
  });

  await Promise.all(
    branches.map((branch) =>
      prisma.userBranchAccess.upsert({
        where: {
          userId_branchId: {
            userId: owner.id,
            branchId: branch.id,
          },
        },
        update: {},
        create: {
          userId: owner.id,
          branchId: branch.id,
        },
      }),
    ),
  );

  const internalUsers = [
    {
      email: "atendente-alvorada-1@deliveryreg.local",
      name: "Atendente Alvorada 1",
      role: "ATTENDANT" as const,
      branches: branches.filter((branch) => branch.name === "Alvorada 1"),
    },
    {
      email: "entregador-alvorada-1@deliveryreg.local",
      name: "Entregador Alvorada 1",
      role: "DELIVERY" as const,
      branches: branches.filter((branch) => branch.name === "Alvorada 1"),
    },
    {
      email: "entregador-alvorada-2@deliveryreg.local",
      name: "Entregador Alvorada 2",
      role: "DELIVERY" as const,
      branches: branches.filter((branch) => branch.name === "Alvorada 2"),
    },
  ];

  for (const userDefinition of internalUsers) {
    const user = await prisma.user.upsert({
      where: {
        businessId_email: {
          businessId: business.id,
          email: userDefinition.email,
        },
      },
      update: {
        isActive: true,
        role: userDefinition.role,
      },
      create: {
        businessId: business.id,
        email: userDefinition.email,
        name: userDefinition.name,
        role: userDefinition.role,
        passwordHash: await hashPassword("troque-esta-senha"),
      },
    });

    await Promise.all(
      userDefinition.branches.map((branch) =>
        prisma.userBranchAccess.upsert({
          where: {
            userId_branchId: {
              userId: user.id,
              branchId: branch.id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            branchId: branch.id,
          },
        }),
      ),
    );
  }

  const categoryDefinitions: SeedCategory[] = [
    {
      name: "Queijos",
      slug: "queijos",
      description: "Produtos vendidos por peso e separados na loja",
      sortOrder: 1,
    },
    {
      name: "Farinhas e derivados",
      slug: "farinhas-e-derivados",
      description: "Tapiocas, gomas e derivados regionais.",
      sortOrder: 2,
    },
    {
      name: "Regionais",
      slug: "regionais",
      description: "Itens tradicionais da região.",
      sortOrder: 3,
    },
  ];

  const categories = new Map<string, { id: string }>();

  for (const categoryDefinition of categoryDefinitions) {
    const category = await prisma.productCategory.upsert({
      where: {
        businessId_slug: {
          businessId: business.id,
          slug: categoryDefinition.slug,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        businessId: business.id,
        name: categoryDefinition.name,
        slug: categoryDefinition.slug,
        description: categoryDefinition.description,
        sortOrder: categoryDefinition.sortOrder,
      },
      select: {
        id: true,
      },
    });
    categories.set(categoryDefinition.slug, category);
  }

  const productDefinitions: SeedProduct[] = [
    {
      name: "Queijo regional",
      slug: "queijo-regional",
      categorySlug: "queijos",
      description: "Peça o peso desejado e pague pelo peso real separado na unidade.",
      measurementType: "WEIGHT",
      baseUnit: "GRAM",
      sellingIncrement: 50,
      minimumOrderQuantity: 250,
      priceCents: 4200,
      priceBasisQuantity: 1000,
      priceBasisUnit: "GRAM",
    },
    {
      name: "Queijo de búfalo",
      slug: "queijo-de-bufalo",
      categorySlug: "queijos",
      description: "Queijo regional vendido por peso.",
      measurementType: "WEIGHT",
      baseUnit: "GRAM",
      sellingIncrement: 50,
      minimumOrderQuantity: 250,
      priceCents: 4200,
      priceBasisQuantity: 1000,
      priceBasisUnit: "GRAM",
    },
    {
      name: "Queijo coalho",
      slug: "queijo-coalho",
      categorySlug: "queijos",
      description: "Queijo coalho vendido por peso.",
      measurementType: "WEIGHT",
      baseUnit: "GRAM",
      sellingIncrement: 50,
      minimumOrderQuantity: 250,
      priceCents: 4200,
      priceBasisQuantity: 1000,
      priceBasisUnit: "GRAM",
    },
    {
      name: "Queijo manteiga",
      slug: "queijo-manteiga",
      categorySlug: "queijos",
      description: "Queijo manteiga vendido por peso.",
      measurementType: "WEIGHT",
      baseUnit: "GRAM",
      sellingIncrement: 50,
      minimumOrderQuantity: 250,
      priceCents: 4500,
      priceBasisQuantity: 1000,
      priceBasisUnit: "GRAM",
    },
    {
      name: "Farinha de tapioca",
      slug: "farinha-de-tapioca",
      categorySlug: "farinhas-e-derivados",
      description: "Produto regional disponível para pedido.",
      measurementType: "PACKAGE",
      baseUnit: "PACKAGE",
      sellingIncrement: 1,
      minimumOrderQuantity: 1,
    },
    {
      name: "Goma de tapioca",
      slug: "goma-de-tapioca",
      categorySlug: "farinhas-e-derivados",
      description: "Produto regional disponível para pedido.",
      measurementType: "PACKAGE",
      baseUnit: "PACKAGE",
      sellingIncrement: 1,
      minimumOrderQuantity: 1,
    },
    {
      name: "Pé de moleque",
      slug: "pe-de-moleque",
      categorySlug: "regionais",
      description: "Produto regional disponível para pedido.",
      measurementType: "UNIT",
      baseUnit: "UNIT",
      sellingIncrement: 1,
      minimumOrderQuantity: 1,
    },
  ];

  for (const productDefinition of productDefinitions) {
    const category = categories.get(productDefinition.categorySlug);

    if (!category) {
      throw new Error(`Missing seed category ${productDefinition.categorySlug}`);
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        businessId_slug: {
          businessId: business.id,
          slug: productDefinition.slug,
        },
      },
      select: {
        id: true,
      },
    });

    const product = await prisma.product.upsert({
      where: {
        businessId_slug: {
          businessId: business.id,
          slug: productDefinition.slug,
        },
      },
      update: {},
      create: {
        businessId: business.id,
        categoryId: category.id,
        name: productDefinition.name,
        slug: productDefinition.slug,
        description: productDefinition.description,
        measurementType: productDefinition.measurementType,
        baseUnit: productDefinition.baseUnit,
        sellingIncrement: productDefinition.sellingIncrement,
        minimumOrderQuantity: productDefinition.minimumOrderQuantity,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (productDefinition.priceCents) {
      const activePrice = await prisma.productPrice.findFirst({
        where: {
          businessId: business.id,
          productId: product.id,
          endsAt: null,
        },
      });

      if (!activePrice) {
        await prisma.productPrice.create({
          data: {
            businessId: business.id,
            productId: product.id,
            priceCents: productDefinition.priceCents,
            basisQuantity: productDefinition.priceBasisQuantity ?? 1,
            basisUnit: productDefinition.priceBasisUnit ?? productDefinition.baseUnit,
          },
        });
      }
    }

    await Promise.all(
      branches.map((branch) =>
        prisma.productBranchAvailability.upsert({
          where: {
            businessId_branchId_productId: {
              businessId: business.id,
              branchId: branch.id,
              productId: product.id,
            },
          },
          update: existingProduct ? {} : { isAvailable: true },
          create: {
            businessId: business.id,
            branchId: branch.id,
            productId: product.id,
            isAvailable: true,
          },
        }),
      ),
    );
  }

  const sourceDefinitions = [
    {
      code: "qr-alvorada-1-01",
      label: "QR Code Alvorada 1 - 01",
      branchName: "Alvorada 1",
    },
    {
      code: "qr-alvorada-1-02",
      label: "QR Code Alvorada 1 - 02",
      branchName: "Alvorada 1",
    },
    {
      code: "qr-alvorada-2-01",
      label: "QR Code Alvorada 2 - 01",
      branchName: "Alvorada 2",
    },
    {
      code: "qr-alvorada-2-02",
      label: "QR Code Alvorada 2 - 02",
      branchName: "Alvorada 2",
    },
    { code: "balcao", label: "Balcão" },
    { code: "embalagem", label: "Embalagem" },
    { code: "instagram", label: "Instagram" },
    { code: "whatsapp", label: "WhatsApp" },
  ];
  await Promise.all(
    sourceDefinitions.map((source) => {
      const branch = source.branchName
        ? branches.find((item) => item.name === source.branchName)
        : undefined;

      return prisma.leadSource.upsert({
        where: {
          businessId_code: {
            businessId: business.id,
            code: source.code,
          },
        },
        update: {
          label: source.label,
          branchId: branch?.id,
          isActive: true,
        },
        create: {
          businessId: business.id,
          branchId: branch?.id,
          code: source.code,
          label: source.label,
        },
      });
    }),
  );

  await Promise.all(
    branches.flatMap((branch) =>
      ["Alvorada", "Dom Pedro", "Ponta Negra"].map((zoneName) =>
        prisma.deliveryZone.upsert({
          where: {
            businessId_branchId_normalizedName: {
              businessId: business.id,
              branchId: branch.id,
              normalizedName: zoneName.toLowerCase().replace(/\s+/g, "-"),
            },
          },
          update: {
            isActive: true,
            feeCents: 800,
            minimumOrderCents: 3000,
          },
          create: {
            businessId: business.id,
            branchId: branch.id,
            name: zoneName,
            normalizedName: zoneName.toLowerCase().replace(/\s+/g, "-"),
            feeCents: 800,
            minimumOrderCents: 3000,
          },
        }),
      ),
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
