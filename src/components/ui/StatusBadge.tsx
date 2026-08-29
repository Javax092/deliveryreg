import type {
  CashSessionStatus,
  DeliveryStatus,
  OrderStatus,
} from "@prisma/client";

import { Badge } from "@/components/ui/Badge";

type BadgeVariant =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

type StatusConfig = {
  label: string;
  variant: BadgeVariant;
};

const orderStatusConfig: Record<OrderStatus, StatusConfig> = {
  CREATED: {
    label: "Novo",
    variant: "info",
  },
  ACCEPTED: {
    label: "Aceito",
    variant: "info",
  },
  PREPARING: {
    label: "Em preparo",
    variant: "warning",
  },
  READY: {
    label: "Pronto",
    variant: "success",
  },
  COMPLETED: {
    label: "Concluído",
    variant: "success",
  },
  CANCELLED: {
    label: "Cancelado",
    variant: "danger",
  },
};

const deliveryStatusConfig: Record<DeliveryStatus, StatusConfig> = {
  ASSIGNED: {
    label: "Atribuída",
    variant: "info",
  },
  PICKED_UP: {
    label: "Coletada",
    variant: "info",
  },
  ON_ROUTE: {
    label: "Em rota",
    variant: "warning",
  },
  DELIVERED: {
    label: "Entregue",
    variant: "success",
  },
  FAILED: {
    label: "Falha na entrega",
    variant: "danger",
  },
};

const cashStatusConfig: Record<CashSessionStatus, StatusConfig> = {
  OPEN: {
    label: "Aberto",
    variant: "success",
  },
  CLOSED: {
    label: "Fechado",
    variant: "neutral",
  },
};

export function OrderStatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  const config = orderStatusConfig[status];

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}

export function DeliveryStatusBadge({
  status,
}: {
  status: DeliveryStatus;
}) {
  const config = deliveryStatusConfig[status];

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}

export function CashStatusBadge({
  status,
}: {
  status: CashSessionStatus;
}) {
  const config = cashStatusConfig[status];

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}
