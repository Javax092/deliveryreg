import { expect, test } from "@playwright/test";

import { createA2OrderDirect, e2e, login, logout, prisma } from "../fixtures";

test.describe("Login, sessao, RBAC e isolamento", () => {
  test("valida login, falha de credenciais, logout e sessao revogada", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(e2e.users.ownerA);
    await page.getByLabel("Senha").fill("senha-incorreta");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();

    await login(page, e2e.users.ownerA);
    await expect(page.getByRole("heading", { name: "Painel operacional" })).toBeVisible();
    await logout(page);

    await page.goto("/painel");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();

    await login(page, e2e.users.ownerA);
    const owner = await prisma.user.findFirstOrThrow({ where: { email: e2e.users.ownerA } });
    await prisma.session.updateMany({
      where: { userId: owner.id, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    await page.goto("/painel");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(e2e.users.inactiveA);
    await page.getByLabel("Senha").fill(e2e.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();
  });

  test("aplica RBAC visivel para owner, manager, attendant e delivery", async ({ page }) => {
    await login(page, e2e.users.ownerA);
    await page.goto("/gestao");
    await expect(page.getByRole("heading", { name: "Gestão" })).toBeVisible();

    await logout(page);
    await login(page, e2e.users.managerA);
    await page.goto("/pdv");
    await expect(page.getByRole("heading", { name: "PDV presencial" })).toBeVisible();

    await logout(page);
    await login(page, e2e.users.attendantA1);
    await page.goto("/gestao");
    await expect(page.getByText("Faturamento")).not.toBeVisible();
    await page.goto("/pdv");
    await expect(page.getByRole("heading", { name: "PDV presencial" })).toBeVisible();

    await logout(page);
    await login(page, e2e.users.deliveryA1);
    await page.goto("/entregas");
    await expect(page.getByRole("heading", { name: "Entregas" })).toBeVisible();
    await page.goto("/pdv");
    await expect(page.getByRole("heading", { name: "PDV presencial" })).not.toBeVisible();
  });

  test("isola filial A2 de usuario operacional restrito a A1", async ({ page }) => {
    await createA2OrderDirect();
    await login(page, e2e.users.attendantA1);
    await page.goto("/operacao");

    await expect(page.getByText("E2E Pedido A2 Invisivel")).not.toBeVisible();
    await page.goto("/pdv");
    await expect(page.getByRole("heading", { name: "Caixa fechado" })).toBeVisible();
    await expect(page.getByText("E2E Filial A2")).not.toBeVisible();
  });

  test("isola Business B contra acesso direto autenticado pela Business A", async ({ page }) => {
    await login(page, e2e.users.ownerA);
    await page.goto("/produto/e2e-produto-b");
    await expect(page.getByText(e2e.businessBProductName)).not.toBeVisible();

    await page.goto("/gestao");
    await expect(page.getByText("E2E Business B")).not.toBeVisible();
    await expect(page.getByText(e2e.businessBProductName)).not.toBeVisible();
  });
});
