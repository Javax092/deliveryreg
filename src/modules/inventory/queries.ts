import { prisma } from "@/db/prisma";
import type { StockMovementType } from "@/modules/inventory/ledger";
import { summarizeInventory } from "@/modules/inventory/ledger";

export async function listInventoryBalances(input: {
  businessId: string;
  branchId?: string;
}) {
  const [products, movementTotals] = await Promise.all([
    prisma.product.findMany({
      where: {
        businessId: input.businessId
      },
      select: {
        id: true,
        name: true,
        measurementType: true,
        isActive: true,
        availability: {
          where: input.branchId ? { branchId: input.branchId } : undefined,
          select: {
            branchId: true,
            isAvailable: true,
            branch: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    }),
    prisma.stockMovement.groupBy({
      by: ["productId", "type"],
      where: {
        businessId: input.businessId,
        branchId: input.branchId
      },
      _sum: {
        quantityDelta: true
      },
      _max: {
        createdAt: true
      }
    })
  ]);

  const movementsByProduct = new Map<
    string,
    Array<{ type: StockMovementType; quantityDelta: number }>
  >();
  const lastMovementByProduct = new Map<string, Date | null>();

  for (const total of movementTotals) {
    const movements = movementsByProduct.get(total.productId) ?? [];
    movements.push({
      type: total.type,
      quantityDelta: total._sum.quantityDelta ?? 0
    });
    movementsByProduct.set(total.productId, movements);
    const currentLast = lastMovementByProduct.get(total.productId);
    if (!currentLast || (total._max.createdAt && total._max.createdAt > currentLast)) {
      lastMovementByProduct.set(total.productId, total._max.createdAt);
    }
  }

  return products.map((product) => ({
    product,
    summary: summarizeInventory(movementsByProduct.get(product.id) ?? []),
    lastMovementAt: lastMovementByProduct.get(product.id) ?? null
  }));
}
