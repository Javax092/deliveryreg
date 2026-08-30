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

const productAdminValidationMessages = {
  name: "Informe um nome válido.",
  description: "Informe uma descrição com até 500 caracteres.",
  categoryId: "Selecione uma categoria.",
  imageUrl: "Informe uma URL de imagem válida.",
  measurementType: "Selecione a unidade de venda.",
  price: "Informe um preço válido.",
  minimumOrderQuantity: "Informe uma quantidade mínima válida.",
  sellingIncrement: "Informe um incremento válido.",
  availableBranchIds: "Selecione pelo menos uma unidade disponível."
} as const;

type ProductAdminValidationField = keyof typeof productAdminValidationMessages;

type ProductAdminValidationDetails = {
  field: ProductAdminValidationField;
};

const productWriteTransactionOptions = {
  maxWait: 5_000,
  timeout: 15_000
};

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
  const rawInput = {
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
  };

  const result = productAdminSchema.safeParse(rawInput);

  if (!result.success) {
    logProductAdminValidationFailure(rawInput, result.error.issues);
    const field = getProductAdminValidationField(result.error.issues[0]?.path[0]);
    throw new AppError("VALIDATION_ERROR", {
      details: {
        ...result.error.flatten(),
        ...(field ? { field } : {})
      }
    });
  }

  return result.data;
}

export function getProductAdminValidationMessage(error: unknown): string | undefined {
  if (!(error instanceof AppError) || error.code !== "VALIDATION_ERROR") {
    return undefined;
  }

  const details = error.details;
  const field =
    isProductAdminValidationDetails(details) ? details.field : getProductAdminValidationFieldFromMessage(error.message);

  return field ? productAdminValidationMessages[field] : undefined;
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

    const availableBranchIds = new Set(data.availableBranchIds);
    const unavailableBranchIds = data.allBranches
      .map((branch) => branch.id)
      .filter((branchId) => !availableBranchIds.has(branchId));

    await tx.productBranchAvailability.createMany({
      data: data.allBranches.map((branch) => ({
        businessId: input.context.businessId,
        branchId: branch.id,
        productId: current.id,
        isAvailable: availableBranchIds.has(branch.id)
      })),
      skipDuplicates: true
    });

    await tx.productBranchAvailability.updateMany({
      where: {
        businessId: input.context.businessId,
        productId: current.id,
        branchId: {
          in: data.availableBranchIds
        }
      },
      data: {
        isAvailable: true
      }
    });

    if (unavailableBranchIds.length > 0) {
      await tx.productBranchAvailability.updateMany({
        where: {
          businessId: input.context.businessId,
          productId: current.id,
          branchId: {
            in: unavailableBranchIds
          }
        },
        data: {
          isAvailable: false
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
  }, productWriteTransactionOptions);
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
      message: "Invalid category.",
      details: { field: "categoryId" } satisfies ProductAdminValidationDetails
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

function getProductAdminValidationField(value: unknown): ProductAdminValidationField | undefined {
  if (typeof value === "string" && value in productAdminValidationMessages) {
    return value as ProductAdminValidationField;
  }

  return undefined;
}

function getProductAdminValidationFieldFromMessage(message: string): ProductAdminValidationField | undefined {
  if (message === "Invalid currency amount.") {
    return "price";
  }

  if (message === "Quantity violates minimum or increment rules.") {
    return "minimumOrderQuantity";
  }

  return undefined;
}

function isProductAdminValidationDetails(value: unknown): value is ProductAdminValidationDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    "field" in value &&
    typeof value.field === "string" &&
    value.field in productAdminValidationMessages
  );
}

function logProductAdminValidationFailure(
  rawInput: Record<string, unknown>,
  issues: z.core.$ZodIssue[]
): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.warn(
    "Product admin form validation failed",
    issues.map((issue) => {
      const path = issue.path.join(".");
      const value = getRawProductAdminValue(rawInput, issue.path);

      return {
        path,
        code: issue.code,
        message: issue.message,
        receivedType: Array.isArray(value) ? "array" : typeof value
      };
    })
  );
}

function getRawProductAdminValue(input: Record<string, unknown>, path: PropertyKey[]): unknown {
  const [field] = path;

  if (typeof field !== "string" || !(field in input)) {
    return undefined;
  }

  return input[field];
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
