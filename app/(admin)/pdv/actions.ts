"use server";

import { revalidatePath } from "next/cache";

import { createPosSale } from "@/modules/pos/create-pos-sale";
import { actionError, actionOk, type ActionResult } from "@/modules/shared/actions/action-result";
import { getCurrentUserContext } from "@/modules/shared/auth/permissions";

export async function finalizePosSale(formData: FormData): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();

    await createPosSale({
      context,
      branchId: String(formData.get("branchId")),
      productId: String(formData.get("productId")),
      quantity: Number(formData.get("quantity")),
      paymentMethod: String(formData.get("paymentMethod")) as "CASH" | "PIX" | "DEBIT_CARD" | "CREDIT_CARD",
      idempotencyKey: String(formData.get("idempotencyKey"))
    });

    revalidatePath("/pdv");
    revalidatePath("/estoque");
    return actionOk("Venda finalizada.");
  } catch (error) {
    return actionError(error, "Não foi possível finalizar a venda.", {
      AUTHORIZATION_ERROR: "Você não possui permissão para vender nesta unidade.",
      CONFLICT: "Esta venda já foi processada ou os dados mudaram.",
      INVENTORY_CONFLICT: "Não há estoque suficiente para finalizar a venda.",
      INVALID_STATE_TRANSITION: "Abra o caixa desta unidade antes de vender no PDV.",
      NOT_FOUND: "Produto indisponível para esta unidade.",
      VALIDATION_ERROR: "Confira produto, quantidade e pagamento."
    });
  }
}
