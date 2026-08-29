import { assignDeliveryAction, markDelivered, markFailed, markOnRoute, markPickedUp } from "./actions";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { prisma } from "@/db/prisma";
import { listAssignableDeliveryUsers } from "@/modules/delivery/operation";
import { buildMapsDestination } from "@/modules/delivery/rules";
import { formatBRL } from "@/modules/shared/money/money";
import { hasPermission, requirePermission } from "@/modules/shared/auth/permissions";

export const dynamic = "force-dynamic";

const statusLabels = {
  ASSIGNED: "Atribuída",
  PICKED_UP: "Retirada",
  ON_ROUTE: "Em rota",
  DELIVERED: "Entregue",
  FAILED: "Falhou"
};

export default async function EntregasPage() {
  const context = await requirePermission("delivery:assigned:read");
  const canManageDelivery = hasPermission(context, "delivery:manage");
  const [deliveries, deliveryUsers] = await Promise.all([
    prisma.delivery.findMany({
    where: {
      businessId: context.businessId,
      ...(context.role === "DELIVERY" ? { assignedUserId: context.userId } : {}),
      status: {
        in: ["ASSIGNED", "PICKED_UP", "ON_ROUTE"]
      }
    },
    select: {
      id: true,
      status: true,
      assignedUserId: true,
      feeCents: true,
      order: {
        select: {
          totalCents: true,
          customer: {
            select: {
              name: true
            }
          }
        }
      },
      address: {
        select: {
          street: true,
          number: true,
          neighborhood: true,
          reference: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
    }),
    canManageDelivery ? listAssignableDeliveryUsers(context) : Promise.resolve([])
  ]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-semibold text-slate-950">Entregas</h1>
        <p className="mt-2 text-slate-700">Mostrando apenas entregas atribuídas quando o usuário é entregador.</p>

        <div className="mt-5 space-y-4">
          {deliveries.length === 0 ? (
            <div className="rounded-lg bg-white p-4 text-slate-700">
              <p className="font-semibold text-slate-950">Nenhuma entrega em andamento.</p>
              <p className="mt-1 text-sm">Entregas atribuídas aparecerão aqui automaticamente.</p>
            </div>
          ) : (
            deliveries.map((delivery) => (
              <article className="rounded-lg bg-white p-4" key={delivery.id}>
                <div className="flex justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-950">Entrega #{delivery.id.slice(-6)}</h2>
                    <p className="text-sm text-slate-600">{statusLabels[delivery.status]}</p>
                  </div>
                  <p className="font-semibold">{formatBRL(delivery.order.totalCents)}</p>
                </div>
                <div className="mt-3 text-sm text-slate-700">
                  <p>Cliente: {delivery.order.customer?.name ?? "Não informado"}</p>
                  <p>Entregador: {delivery.assignedUserId ? "Atribuído" : "Pendente"}</p>
                  <p>
                    Endereço: {delivery.address.street}, {delivery.address.number}
                  </p>
                  <p>Bairro: {delivery.address.neighborhood}</p>
                  {delivery.address.reference ? <p>Referência: {delivery.address.reference}</p> : null}
                </div>

                <a
                  className="mt-4 flex h-11 items-center justify-center rounded-md border border-emerald-700 font-semibold text-emerald-800"
                  href={buildMapsDestination(delivery.address)}
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir rota
                </a>

                {canManageDelivery ? (
                  <AdminActionForm
                    action={assignDeliveryAction}
                    className="mt-3 grid gap-2"
                    pendingLabel="Atribuindo..."
                    submitLabel="Atribuir entrega"
                    variant="secondary"
                  >
                    <input name="deliveryId" type="hidden" value={delivery.id} />
                    <select
                      className="h-11 rounded-md border border-slate-300 px-3"
                      defaultValue={delivery.assignedUserId ?? ""}
                      name="deliveryUserId"
                    >
                      <option disabled value="">
                        Selecionar entregador
                      </option>
                      {deliveryUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </AdminActionForm>
                ) : null}

                <div className="mt-3 grid gap-2">
                  {delivery.status === "ASSIGNED" ? (
                    <AdminActionForm
                      action={markPickedUp}
                      pendingLabel="Salvando..."
                      submitLabel="Retirei o pedido"
                    >
                      <input name="deliveryId" type="hidden" value={delivery.id} />
                    </AdminActionForm>
                  ) : null}
                  {delivery.status === "PICKED_UP" ? (
                    <AdminActionForm
                      action={markOnRoute}
                      pendingLabel="Salvando..."
                      submitLabel="Saí para entrega"
                    >
                      <input name="deliveryId" type="hidden" value={delivery.id} />
                    </AdminActionForm>
                  ) : null}
                  {delivery.status === "ON_ROUTE" ? (
                    <AdminActionForm
                      action={markDelivered}
                      pendingLabel="Concluindo..."
                      submitLabel="Entregue"
                    >
                      <input name="deliveryId" type="hidden" value={delivery.id} />
                    </AdminActionForm>
                  ) : null}
                  <AdminActionForm
                    action={markFailed}
                    pendingLabel="Salvando..."
                    submitLabel="Falha na entrega"
                    variant="danger"
                  >
                    <input name="deliveryId" type="hidden" value={delivery.id} />
                  </AdminActionForm>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
