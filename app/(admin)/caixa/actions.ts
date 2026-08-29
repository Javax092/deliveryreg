"use server";

import { revalidatePath } from "next/cache";

import { closeCashSession, createCashMovement, openCashSession } from "@/modules/cash/service";
import { parseMoneyInput } from "@/modules/cash/calculations";
import { actionError, actionOk, type ActionResult } from "@/modules/shared/actions/action-result";
import { getCurrentUserContext } from "@/modules/shared/auth/permissions";

export async function openCashRegister(formData: FormData): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();
    await openCashSession({
      context,
      branchId: String(formData.get("branchId")),
      openingAmountCents: parseMoneyInput(formData.get("openingAmount")),
      idempotencyKey: String(formData.get("idempotencyKey"))
    });
    revalidateCashPaths();
    return actionOk("Caixa aberto.");
  } catch (error) {
    return actionError(error, "Não foi possível abrir o caixa.", {
      AUTHORIZATION_ERROR: "Você não possui acesso ao caixa desta unidade.",
      CONFLICT: "Já existe um caixa aberto para esta unidade.",
      NOT_FOUND: "Unidade não encontrada.",
      VALIDATION_ERROR: "Informe um fundo inicial válido."
    });
  }
}

export async function createCashSupply(formData: FormData): Promise<ActionResult> {
  return createMovementAction(formData, "SUPPLY");
}

export async function createCashWithdrawal(formData: FormData): Promise<ActionResult> {
  return createMovementAction(formData, "WITHDRAWAL");
}

export async function closeCashRegister(formData: FormData): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();
    await closeCashSession({
      context,
      cashSessionId: String(formData.get("cashSessionId")),
      countedCashCents: parseMoneyInput(formData.get("countedCash")),
      closingNote: String(formData.get("closingNote") ?? ""),
      idempotencyKey: String(formData.get("idempotencyKey"))
    });
    revalidateCashPaths();
    return actionOk("Caixa fechado.");
  } catch (error) {
    return actionError(error, "Não foi possível fechar o caixa.", {
      AUTHORIZATION_ERROR: "Você não possui permissão para fechar este caixa.",
      CONFLICT: "Este caixa já foi fechado.",
      INVALID_STATE_TRANSITION: "Este caixa já foi fechado.",
      NOT_FOUND: "Caixa não encontrado.",
      VALIDATION_ERROR: "Confira a contagem e a observação da divergência."
    });
  }
}

async function createMovementAction(formData: FormData, type: "SUPPLY" | "WITHDRAWAL") {
  try {
    const context = await getCurrentUserContext();
    await createCashMovement({
      context,
      cashSessionId: String(formData.get("cashSessionId")),
      type,
      amountCents: parseMoneyInput(formData.get("amount")),
      reason: String(formData.get("reason") ?? ""),
      idempotencyKey: String(formData.get("idempotencyKey"))
    });
    revalidateCashPaths();
    return actionOk(type === "SUPPLY" ? "Suprimento registrado." : "Sangria registrada.");
  } catch (error) {
    return actionError(error, "Não foi possível registrar a movimentação.", {
      AUTHORIZATION_ERROR: "Você não possui acesso ao caixa desta unidade.",
      CONFLICT: "Esta movimentação já foi processada ou os dados mudaram.",
      INVALID_STATE_TRANSITION: "O caixa precisa estar aberto.",
      NOT_FOUND: "Caixa não encontrado.",
      VALIDATION_ERROR: "Informe valor e motivo válidos."
    });
  }
}

function revalidateCashPaths() {
  revalidatePath("/caixa");
  revalidatePath("/caixa/historico");
  revalidatePath("/painel");
  revalidatePath("/gestao");
  revalidatePath("/pdv");
}
