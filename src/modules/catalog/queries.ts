import { prisma } from "@/db/prisma";
import type { AuthContext } from "@/modules/shared/auth/context";

export async function listAdminProducts(businessId: string, input?: {
  search?: string | null;
  categoryId?: string | null;
  status?: "active" | "inactive" | "all" | null;
  branchId?: string | null;
}) {
  const search = input?.search?.trim();

  const [products, movementTotals] = await Promise.all([
    prisma.product.findMany({
    where: {
      businessId,
      ...(input?.status === "active" ? { isActive: true } : {}),
      ...(input?.status === "inactive" ? { isActive: false } : {}),
      ...(input?.categoryId ? { categoryId: input.categoryId } : {}),
      ...(search
        ? {
            name: {
              contains: search,
              mode: "insensitive"
            }
          }
        : {}),
      ...(input?.branchId
        ? {
            availability: {
              some: {
                branchId: input.branchId,
                isAvailable: true
              }
            }
          }
        : {})
    },
    include: {
      category: true,
      prices: {
        where: {
          endsAt: null
        },
        orderBy: {
          startsAt: "desc"
        },
        take: 1
      },
      availability: {
        include: {
          branch: true
        },
        orderBy: {
          branch: {
            name: "asc"
          }
        }
      }
    },
    orderBy: {
      name: "asc"
    }
    }),
    prisma.stockMovement.groupBy({
      by: ["productId", "branchId"],
      where: {
        businessId
      },
      _sum: {
        quantityDelta: true
      },
      _max: {
        createdAt: true
      }
    })
  ]);

  const stockByProduct = new Map<
    string,
    Array<{ branchId: string; quantity: number; lastMovementAt: Date | null }>
  >();

  for (const total of movementTotals) {
    const rows = stockByProduct.get(total.productId) ?? [];
    rows.push({
      branchId: total.branchId,
      quantity: total._sum.quantityDelta ?? 0,
      lastMovementAt: total._max.createdAt
    });
    stockByProduct.set(total.productId, rows);
  }

  return products.map((product) => ({
    ...product,
    stockByBranch: stockByProduct.get(product.id) ?? []
  }));
}

export async function listAdminCategories(businessId: string) {
  return prisma.productCategory.findMany({
    where: {
      businessId
    },
    orderBy: [
      {
        sortOrder: "asc"
      },
      {
        name: "asc"
      }
    ]
  });
}

export async function getProductEditorData(context: AuthContext, productId?: string) {
  const [branches, categories, product] = await Promise.all([
    prisma.branch.findMany({
      where: {
        businessId: context.businessId,
        isActive: true,
        ...(context.role === "ATTENDANT" || context.role === "DELIVERY"
          ? {
              id: {
                in: context.branchIds
              }
            }
          : {})
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: "asc"
      }
    }),
    prisma.productCategory.findMany({
      where: {
        businessId: context.businessId,
        isActive: true
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" }
      ]
    }),
    productId
      ? prisma.product.findFirst({
          where: {
            id: productId,
            businessId: context.businessId
          },
          include: {
            category: true,
            prices: {
              orderBy: {
                startsAt: "desc"
              },
              take: 8
            },
            availability: true
          }
        })
      : Promise.resolve(null)
  ]);

  return {
    branches,
    categories,
    product
  };
}
