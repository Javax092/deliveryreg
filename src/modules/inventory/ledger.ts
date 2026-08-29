import { AppError } from "@/modules/shared/errors/app-error";

export type StockMovementType =
  | "PURCHASE"
  | "SALE"
  | "LOSS"
  | "ADJUSTMENT"
  | "TRANSFER"
  | "RETURN";

export type StockMovementInput = {
  type: StockMovementType;
  quantityDelta: number;
};

export type InventorySummary = {
  purchased: number;
  sold: number;
  lost: number;
  adjusted: number;
  transferredIn: number;
  transferredOut: number;
  returned: number;
  current: number;
};

export function assertStockMovement(input: StockMovementInput): void {
  if (!Number.isInteger(input.quantityDelta) || input.quantityDelta === 0) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Stock movement quantity must be a non-zero integer."
    });
  }

  if (["SALE", "LOSS"].includes(input.type) && input.quantityDelta >= 0) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Sale and loss movements must reduce stock."
    });
  }

  if (["PURCHASE", "RETURN"].includes(input.type) && input.quantityDelta <= 0) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Purchase and return movements must increase stock."
    });
  }
}

export function calculateAvailableQuantity(movements: StockMovementInput[]): number {
  return movements.reduce((total, movement) => {
    assertStockMovement(movement);
    return total + movement.quantityDelta;
  }, 0);
}

export function assertSufficientInventory(currentQuantity: number, saleQuantity: number): void {
  if (!Number.isInteger(currentQuantity) || !Number.isInteger(saleQuantity) || saleQuantity <= 0) {
    throw new AppError("VALIDATION_ERROR");
  }

  if (currentQuantity - saleQuantity < 0) {
    throw new AppError("INVENTORY_CONFLICT", {
      message: "Insufficient inventory for movement."
    });
  }
}

export function summarizeInventory(movements: StockMovementInput[]): InventorySummary {
  return movements.reduce<InventorySummary>(
    (summary, movement) => {
      assertStockMovement(movement);

      if (movement.type === "PURCHASE") {
        summary.purchased += movement.quantityDelta;
      }

      if (movement.type === "SALE") {
        summary.sold += Math.abs(movement.quantityDelta);
      }

      if (movement.type === "LOSS") {
        summary.lost += Math.abs(movement.quantityDelta);
      }

      if (movement.type === "ADJUSTMENT") {
        summary.adjusted += movement.quantityDelta;
      }

      if (movement.type === "TRANSFER" && movement.quantityDelta > 0) {
        summary.transferredIn += movement.quantityDelta;
      }

      if (movement.type === "TRANSFER" && movement.quantityDelta < 0) {
        summary.transferredOut += Math.abs(movement.quantityDelta);
      }

      if (movement.type === "RETURN") {
        summary.returned += movement.quantityDelta;
      }

      summary.current += movement.quantityDelta;
      return summary;
    },
    {
      purchased: 0,
      sold: 0,
      lost: 0,
      adjusted: 0,
      transferredIn: 0,
      transferredOut: 0,
      returned: 0,
      current: 0
    }
  );
}

export function buildTransferMovements(quantity: number): {
  debit: StockMovementInput;
  credit: StockMovementInput;
} {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new AppError("VALIDATION_ERROR");
  }

  return {
    debit: {
      type: "TRANSFER",
      quantityDelta: -quantity
    },
    credit: {
      type: "TRANSFER",
      quantityDelta: quantity
    }
  };
}
