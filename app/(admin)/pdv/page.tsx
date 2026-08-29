import Link from "next/link";

import { PdvWorkspace } from "@/components/admin/PdvWorkspace";
import { prisma } from "@/db/prisma";
import { requirePermission } from "@/modules/shared/auth/permissions";

export const dynamic = "force-dynamic";

export default async function PdvPage() {
  const context = await requirePermission("orders:complete");

  const [branches, products, openCashSessions] = await Promise.all([
    prisma.branch.findMany({
      where: {
        businessId: context.businessId,
        isActive: true,
        ...(context.role === "ATTENDANT" || context.role === "DELIVERY"
          ? {
              id: {
                in: context.branchIds,
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.product.findMany({
      where: {
        businessId: context.businessId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        measurementType: true,
        baseUnit: true,
        sellingIncrement: true,
        minimumOrderQuantity: true,

        category: {
          select: {
            id: true,
            name: true,
          },
        },

        prices: {
          where: {
            endsAt: null,
          },
          select: {
            priceCents: true,
            basisQuantity: true,
            basisUnit: true,
          },
          orderBy: {
            startsAt: "desc",
          },
          take: 1,
        },

        availability: {
          where: {
            isAvailable: true,
          },
          select: {
            branchId: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.cashSession.findMany({
      where: {
        businessId: context.businessId,
        status: "OPEN",
        ...(context.branchIds.length > 0
          ? {
              branchId: {
                in: context.branchIds,
              },
            }
          : {}),
      },
      select: {
        branchId: true,
      },
    }),
  ]);

  const openBranchIds = new Set(
    openCashSessions.map((session) => session.branchId),
  );

  const openBranches = branches.filter((branch) =>
    openBranchIds.has(branch.id),
  );

  return (
    <div className="w-full">
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">Venda presencial</p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          PDV
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Registre vendas realizadas no balcão com atualização de estoque e
          caixa.
        </p>
      </div>

      {openBranches.length === 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Operação indisponível
            </p>

            <h2 className="mt-2 text-xl font-semibold text-amber-950">
              Caixa fechado
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-900">
              É necessário abrir o caixa de uma unidade antes de registrar
              vendas presenciais.
            </p>

            <Link
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              href="/caixa"
            >
              Abrir caixa
            </Link>
          </div>
        </section>
      ) : (
        <PdvWorkspace branches={openBranches} products={products} />
      )}
    </div>
  );
}
