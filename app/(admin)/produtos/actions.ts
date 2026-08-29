"use server";

import { revalidatePath } from "next/cache";

import {
  createCommercialProduct,
  parseProductAdminForm,
  updateCommercialProduct
} from "@/modules/catalog/admin-service";
import { actionError, actionOk, type ActionResult } from "@/modules/shared/actions/action-result";
import { getCurrentUserContext } from "@/modules/shared/auth/permissions";

export async function createProductAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();
    const product = await createCommercialProduct({
      context,
      data: parseProductAdminForm(formData)
    });
    revalidatePath("/produtos");
    revalidatePath("/catalogo");
    return actionOk(`Produto ${product.name} cadastrado.`);
  } catch (error) {
    return actionError(error, "Não foi possível cadastrar o produto.", {
      AUTHORIZATION_ERROR: "Você não possui permissão para cadastrar produto nesta empresa ou filial.",
      VALIDATION_ERROR: "Confira nome, categoria, preço, unidade e disponibilidade.",
      CONFLICT: "Já existe um produto com dados conflitantes."
    });
  }
}

export async function updateProductAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();
    const productId = String(formData.get("productId") ?? "");
    const product = await updateCommercialProduct({
      context,
      productId,
      data: parseProductAdminForm(formData)
    });
    revalidatePath("/produtos");
    revalidatePath(`/produtos/${product.id}`);
    revalidatePath("/catalogo");
    revalidatePath(`/produto/${product.slug}`);
    return actionOk(`Produto ${product.name} atualizado.`);
  } catch (error) {
    return actionError(error, "Não foi possível atualizar o produto.", {
      AUTHORIZATION_ERROR: "Você não possui permissão para alterar este produto ou filial.",
      NOT_FOUND: "Produto não encontrado nesta empresa.",
      VALIDATION_ERROR: "Confira nome, categoria, preço, unidade e disponibilidade.",
      CONFLICT: "Produto foi alterado antes da sua ação. Atualize e tente novamente."
    });
  }
}
