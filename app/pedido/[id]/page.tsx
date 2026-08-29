import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/db/prisma";
import { formatQuantity } from "@/modules/catalog/product-domain";
import { formatBRL } from "@/modules/shared/money/money";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const statusLabel = {
  CREATED: "Novo",
  ACCEPTED: "Aceito",
  PREPARING: "Em separação",
  READY: "Pronto",
  COMPLETED: "Finalizado",
  CANCELLED: "Cancelado"
};

export default async function PedidoPage({ params }: Props) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: {
      id
    },
    select: {
      status: true,
      fulfillmentType: true,
      subtotalCents: true,
      totalCents: true,
      branch: {
        select: {
          name: true
        }
      },
      items: {
        select: {
          id: true,
          productNameSnapshot: true,
          measurementTypeSnapshot: true,
          requestedQuantity: true,
          estimatedAmountCents: true
        }
      },
      delivery: {
        select: {
          feeCents: true,
          address: {
            select: {
              street: true,
              number: true,
              neighborhood: true,
              reference: true,
            },
          },
        },
      }
    }
  });

  if (!order) {
    notFound();
  }

  const hasWeightItem = order.items.some((item) => item.measurementTypeSnapshot === "WEIGHT");
  const orderReference = id.slice(-6).toUpperCase();
  const fulfillmentLabel = order.fulfillmentType === "DELIVERY" ? "Entrega" : "Retirada";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--surface-page)]">
      <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-[var(--radius-lg)] border border-[var(--success-border)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-xs)]">
          <p className="text-sm font-semibold text-[var(--success)]">Pedido confirmado</p>
          <h1 className="mt-1 text-3xl font-semibold leading-tight text-[var(--text-primary)]">
            Pedido #{orderReference}
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Unidade {order.branch.name}. {fulfillmentLabel}. Status:{" "}
            <strong className="text-[var(--text-primary)]">{statusLabel[order.status]}</strong>.
          </p>
        </div>

        <section className="mt-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Resumo</h2>
          <div className="mt-3 divide-y divide-[var(--border-soft)]">
            {order.items.map((item) => (
              <article className="py-3 first:pt-0 last:pb-0" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)]">
                      {item.productNameSnapshot}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Solicitado:{" "}
                      {formatQuantity({
                        measurementType: item.measurementTypeSnapshot,
                        quantity: item.requestedQuantity,
                      })}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
                    {formatBRL(item.estimatedAmountCents)}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-[var(--border-soft)] pt-4">
            <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
              <span>Subtotal estimado</span>
              <span>{formatBRL(order.subtotalCents)}</span>
            </div>
            {order.delivery ? (
              <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
                <span>Entrega</span>
                <span>{formatBRL(order.delivery.feeCents)}</span>
              </div>
            ) : null}
            <div className="flex items-end justify-between gap-3 pt-2">
              <span className="font-semibold text-[var(--text-primary)]">Total estimado</span>
              <span className="text-2xl font-semibold text-[var(--text-primary)]">
                {formatBRL(order.totalCents)}
              </span>
            </div>
          </div>

          {hasWeightItem ? (
            <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--warning-soft)] p-3 text-sm text-[var(--text-secondary)]">
              Valor estimado. O total final pode variar conforme o peso após o corte/pesagem.
            </p>
          ) : null}
        </section>

        <section className="mt-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Próximo passo</h2>
          {order.fulfillmentType === "DELIVERY" && order.delivery ? (
            <div className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
              <p>A unidade vai conferir o pedido e preparar a entrega.</p>
              <p>
                Endereço: {order.delivery.address.street}, {order.delivery.address.number},{" "}
                {order.delivery.address.neighborhood}
              </p>
              {order.delivery.address.reference ? (
                <p>Referência: {order.delivery.address.reference}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Aguarde a confirmação da unidade antes de retirar o pedido.
            </p>
          )}
        </section>

        <Link
          className="mt-5 flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--success)] px-4 font-semibold text-white"
          href="/catalogo"
        >
          Voltar ao catálogo
        </Link>
      </section>
    </main>
  );
}
