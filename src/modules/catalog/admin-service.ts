import type { BaseUnit, MeasurementType, Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/db/prisma";
import { writeAuditLog } from "@/modules/audit/audit";
import { assertBranchAccess } from "@/modules/business/tenant";
import {
  parseCurrencyToCents,
  slugifyProductName,
  validateProductRules
} from "@/modules/catalog/product-domain";
import type { AuthContext } from "@/modules/shared/auth/context";
import { assertPermission } from "@/modules/shared/auth/permissions";
import { AppError } from "@/modules/shared/errors/app-error";

const productAdminSchema = z.object({
  productId: z.string().optional(),
  name: z.string().trim().min(2),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  categoryId: z.string().min(1),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  measurementType: z.enum(["WEIGHT", "UNIT", "PACKAGE", "VOLUME", "BOX"]),
  price: z.string().trim().min(1),
  minimumOrderQuantity: z.coerce.number().int().positive(),
  sellingIncrement: z.coerce.number().int().positive(),
  isActive: z.boolean(),
  availableBranchIds: z.array(z.string()).min(1)
});

export type ProductAdminInput = z.infer<typeof productAdminSchema>;

const defaultsByMeasurement: Record<
  MeasurementType,
  { baseUnit: BaseUnit; priceBasisQuantity: number; priceBasisUnit: BaseUnit }
> = {
  WEIGHT: { baseUnit: "GRAM", priceBasisQuantity: 1000, priceBasisUnit: "GRAM" },
  UNIT: { baseUnit: "UNIT", priceBasisQuantity: 1, priceBasisUnit: "UNIT" },
  PACKAGE: { baseUnit: "PACKAGE", priceBasisQuantity: 1, priceBasisUnit: "PACKAGE" },
  VOLUME: { baseUnit: "MILLILITER", priceBasisQuantity: 1000, priceBasisUnit: "MILLILITER" },
  BOX: { baseUnit: "BOX", priceBasisQuantity: 1, priceBasisUnit: "BOX" }
};

export function parseProductAdminForm(formData: FormData): ProductAdminInput {
  const result = productAdminSchema.safeParse({
    productId: formData.get("productId") ? String(formData.get("productId")) : undefined,
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    measurementType: String(formData.get("measurementType") ?? "UNIT"),
    price: String(formData.get("price") ?? ""),
    minimumOrderQuantity: Number(formData.get("minimumOrderQuantity")),
    sellingIncrement: Number(formData.get("sellingIncrement")),
    isActive: formData.get("isActive") === "on",
    availableBranchIds: formData.getAll("availableBranchIds").map(String)
  });

  if (!result.success) {
    throw new AppError("VALIDATION_ERROR", {
      details: result.error.flatten()
    });
  }

  return result.data;
}

export async function createCommercialProduct(input: {
  context: AuthContext;
  data: ProductAdminInput;
}) {
  assertPermission(input.context, "inventory:write");
  const data = await normalizeProductAdminInput(input.context, input.data);

  return prisma.$transaction(async (tx) => {
    const slug = await buildUniqueProductSlug(tx, input.context.businessId, data.name);
    const product = await tx.product.create({
      data: {
        businessId: input.context.businessId,
        categoryId: data.categoryId,
        name: data.name,
        slug,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        measurementType: data.measurementType,
        baseUnit: data.baseUnit,
        sellingIncrement: data.sellingIncrement,
        minimumOrderQuantity: data.minimumOrderQuantity,
        isActive: data.isActive
      }
    });

    await tx.productPrice.create({
      data: {
        businessId: input.context.businessId,
        productId: product.id,
        priceCents: data.priceCents,
        basisQuantity: data.priceBasisQuantity,
        basisUnit: data.priceBasisUnit
      }
    });

    await tx.productBranchAvailability.createMany({
      data: data.availableBranchIds.map((branchId) => ({
        businessId: input.context.businessId,
        branchId,
        productId: product.id,
        isAvailable: true
      }))
    });

    await writeAuditLog({
      tx,
      businessId: input.context.businessId,
      actorUserId: input.context.userId,
      action: "ADMIN_CHANGED",
      entityType: "Product",
      entityId: product.id,
      after: {
        name: product.name,
        slug: product.slug,
        categoryId: product.categoryId,
        measurementType: product.measurementType,
        isActive: product.isActive,
        availableBranchIds: data.availableBranchIds
      } satisfies Prisma.InputJsonValue
    });

    await writeAuditLog({
      tx,
      businessId: input.context.businessId,
      actorUserId: input.context.userId,
      action: "PRICE_CHANGED",
      entityType: "Product",
      entityId: product.id,
      after: {
        priceCents: data.priceCents,
        basisQuantity: data.priceBasisQuantity,
        basisUnit: data.priceBasisUnit
      } satisfies Prisma.InputJsonValue
    });

    return product;
  });
}

export async function updateCommercialProduct(input: {
  context: AuthContext;
  productId: string;
  data: ProductAdminInput;
}) {
  assertPermission(input.context, "inventory:write");
  const data = await normalizeProductAdminInput(input.context, input.data);

  return prisma.$transaction(async (tx) => {
    const current = await tx.product.findFirst({
      where: {
        id: input.productId,
        businessId: input.context.businessId
      },
      include: {
        prices: {
          where: { endsAt: null },
          orderBy: { startsAt: "desc" },
          take: 1
        },
        availability: true
      }
    });

    if (!current) {
      throw new AppError("NOT_FOUND");
    }

    const updated = await tx.product.update({
      where: { id: current.id },
      data: {
        categoryId: data.categoryId,
        name: data.name,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        measurementType: data.measurementType,
        baseUnit: data.baseUnit,
        sellingIncrement: data.sellingIncrement,
        minimumOrderQuantity: data.minimumOrderQuantity,
        isActive: data.isActive
      }
    });

    const currentPrice = current.prices[0];
    const priceChanged =
      !currentPrice ||
      currentPrice.priceCents !== data.priceCents ||
      currentPrice.basisQuantity !== data.priceBasisQuantity ||
      currentPrice.basisUnit !== data.priceBasisUnit;

    if (priceChanged) {
      await tx.productPrice.updateMany({
        where: {
          businessId: input.context.businessId,
          productId: current.id,
          endsAt: null
        },
        data: {
          endsAt: new Date()
        }
      });
      await tx.productPrice.create({
        data: {
          businessId: input.context.businessId,
          productId: current.id,
          priceCents: data.priceCents,
          basisQuantity: data.priceBasisQuantity,
          basisUnit: data.priceBasisUnit
        }
      });
      await writeAuditLog({
        tx,
        businessId: input.context.businessId,
        actorUserId: input.context.userId,
        action: "PRICE_CHANGED",
        entityType: "Product",
        entityId: current.id,
        before: currentPrice
          ? ({
              priceCents: currentPrice.priceCents,
              basisQuantity: currentPrice.basisQuantity,
              basisUnit: currentPrice.basisUnit
            } satisfies Prisma.InputJsonValue)
          : undefined,
        after: {
          priceCents: data.priceCents,
          basisQuantity: data.priceBasisQuantity,
          basisUnit: data.priceBasisUnit
        } satisfies Prisma.InputJsonValue
      });
    }

    for (const branch of data.allBranches) {
      await tx.productBranchAvailability.upsert({
        where: {
          businessId_branchId_productId: {
            businessId: input.context.businessId,
            branchId: branch.id,
            productId: current.id
          }
        },
        update: {
          isAvailable: data.availableBranchIds.includes(branch.id)
        },
        create: {
          businessId: input.context.businessId,
          branchId: branch.id,
          productId: current.id,
          isAvailable: data.availableBranchIds.includes(branch.id)
        }
      });
    }

    await writeAuditLog({
      tx,
      businessId: input.context.businessId,
      actorUserId: input.context.userId,
      action: "ADMIN_CHANGED",
      entityType: "Product",
      entityId: current.id,
      before: {
        name: current.name,
        categoryId: current.categoryId,
        measurementType: current.measurementType,
        isActive: current.isActive,
        availableBranchIds: current.availability
          .filter((availability) => availability.isAvailable)
          .map((availability) => availability.branchId)
      } satisfies Prisma.InputJsonValue,
      after: {
        name: updated.name,
        categoryId: updated.categoryId,
        measurementType: updated.measurementType,
        isActive: updated.isActive,
        availableBranchIds: data.availableBranchIds
      } satisfies Prisma.InputJsonValue
    });

    return updated;
  });
}

async function normalizeProductAdminInput(context: AuthContext, input: ProductAdminInput) {
  const parsed = productAdminSchema.parse(input);
  const defaults = defaultsByMeasurement[parsed.measurementType];
  const priceCents = parseCurrencyToCents(parsed.price);

  const [category, allBranches] = await Promise.all([
    prisma.productCategory.findFirst({
      where: {
        id: parsed.categoryId,
        businessId: context.businessId,
        isActive: true
      }
    }),
    prisma.branch.findMany({
      where: {
        businessId: context.businessId,
        isActive: true
      },
      select: {
        id: true
      }
    })
  ]);

  if (!category) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Invalid category."
    });
  }

  const branchIds = new Set(allBranches.map((branch) => branch.id));
  for (const branchId of parsed.availableBranchIds) {
    if (!branchIds.has(branchId)) {
      throw new AppError("AUTHORIZATION_ERROR");
    }
    assertBranchAccess(context, {
      businessId: context.businessId,
      branchId
    });
  }

  validateProductRules({
    name: parsed.name,
    slug: slugifyProductName(parsed.name) || "produto",
    description: parsed.description || undefined,
    imageUrl: parsed.imageUrl || undefined,
    measurementType: parsed.measurementType,
    baseUnit: defaults.baseUnit,
    sellingIncrement: parsed.sellingIncrement,
    minimumOrderQuantity: parsed.minimumOrderQuantity,
    priceCents,
    priceBasisQuantity: defaults.priceBasisQuantity,
    priceBasisUnit: defaults.priceBasisUnit
  });

  return {
    ...parsed,
    description: (parsed.description ?? "").trim(),
    imageUrl: (parsed.imageUrl ?? "").trim(),
    baseUnit: defaults.baseUnit,
    priceCents,
    priceBasisQuantity: defaults.priceBasisQuantity,
    priceBasisUnit: defaults.priceBasisUnit,
    allBranches
  };
}

async function buildUniqueProductSlug(
  tx: Prisma.TransactionClient,
  businessId: string,
  name: string
) {
  const baseSlug = slugifyProductName(name) || "produto";
  let slug = baseSlug;
  let suffix = 2;

  while (
    await tx.product.findUnique({
      where: {
        businessId_slug: {
          businessId,
          slug
        }
      },
      select: { id: true }
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}
