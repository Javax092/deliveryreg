"use server";

import { revalidatePath } from "next/cache";

import { adjustInventory, transferInventory } from "@/modules/inventory/operations";
import { actionError, actionOk, type ActionResult } from "@/modules/shared/actions/action-result";
import { getCurrentUserContext } from "@/modules/shared/auth/permissions";

export async function adjustStock(formData: FormData): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();
    await adjustInventory({
      context,
      branchId: String(formData.get("branchId")),
      productId: String(formData.get("productId")),
      quantityDelta: Number(formData.get("quantityDelta")),
      reason: String(formData.get("reason"))
    });
    revalidatePath("/estoque");
    return actionOk("Movimentação registrada.");
  } catch (error) {
    return actionError(error, "Não foi possível registrar a movimentação.", {
      AUTHORIZATION_ERROR: "Você não possui permissão para ajustar estoque nesta unidade.",
      INVENTORY_CONFLICT: "Esta movimentação deixaria o estoque inconsistente.",
      VALIDATION_ERROR: "Confira quantidade e motivo antes de registrar."
    });
  }
}

export async function transferStock(formData: FormData): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();
    await transferInventory({
      context,
      fromBranchId: String(formData.get("fromBranchId")),
      toBranchId: String(formData.get("toBranchId")),
      productId: String(formData.get("productId")),
      quantity: Number(formData.get("quantity")),
      reason: String(formData.get("reason"))
    });
    revalidatePath("/estoque");
    return actionOk("Transferência registrada.");
  } catch (error) {
    return actionError(error, "Não foi possível transferir o estoque.", {
      AUTHORIZATION_ERROR: "Você não possui permissão para movimentar uma das unidades.",
      INVENTORY_CONFLICT: "Não há estoque suficiente para transferir.",
      VALIDATION_ERROR: "Origem, destino, quantidade e motivo precisam ser válidos."
    });
  }
}
