import Link from "next/link";
import { Store } from "lucide-react";

import {
  AdminNavLink,
  type AdminNavIcon,
} from "@/components/admin/AdminNavLink";
import type { AuthContext } from "@/modules/shared/auth/context";
import {
  hasPermission,
  type Permission,
} from "@/modules/shared/auth/permissions";

type NavigationItem = {
  label: string;
  href: string;
  icon: AdminNavIcon;
  permission?: Permission;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const navigation: NavigationGroup[] = [
  {
    label: "Visão geral",
    items: [
      {
        label: "Painel",
        href: "/painel",
        icon: "dashboard",
        permission: "audit:read",
      },
    ],
  },
  {
    label: "Operação",
    items: [
      {
        label: "Pedidos",
        href: "/operacao",
        icon: "orders",
        permission: "orders:read",
      },
      {
        label: "PDV",
        href: "/pdv",
        icon: "pdv",
        permission: "orders:write",
      },
      {
        label: "Caixa",
        href: "/caixa",
        icon: "cash",
        permission: "cash:read",
      },
      {
        label: "Entregas",
        href: "/entregas",
        icon: "deliveries",
        permission: "delivery:assigned:read",
      },
    ],
  },
  {
    label: "Catálogo",
    items: [
      {
        label: "Produtos",
        href: "/produtos",
        icon: "products",
        permission: "inventory:read",
      },
      {
        label: "Estoque",
        href: "/estoque",
        icon: "inventory",
        permission: "inventory:read",
      },
    ],
  },
  {
    label: "Relacionamento",
    items: [
      {
        label: "Clientes",
        href: "/clientes",
        icon: "customers",
        permission: "audit:read",
      },
    ],
  },
  {
    label: "Gestão",
    items: [
      {
        label: "Relatórios",
        href: "/gestao",
        icon: "reports",
        permission: "audit:read",
      },
    ],
  },
];

const roleLabels: Record<AuthContext["role"], string> = {
  OWNER: "Administrador",
  MANAGER: "Gerente",
  ATTENDANT: "Atendente",
  DELIVERY: "Entregador",
};

export function AdminShell({
  context,
  children,
}: {
  context: AuthContext;
  children: React.ReactNode;
}) {
  const roleLabel = roleLabels[context.role];

  const visibleGroups = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || hasPermission(context, item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark" aria-hidden="true">
            <Store size={20} strokeWidth={2} />
          </div>

          <div className="admin-brand-copy">
            <strong>DeliveryReg</strong>
            <span>Gestão do quiosque</span>
          </div>
        </div>

        <nav className="admin-navigation" aria-label="Navegação principal">
          {visibleGroups.map((group) => (
            <section className="admin-navigation-group" key={group.label}>
              <span className="admin-navigation-label">{group.label}</span>

              <div className="admin-navigation-items">
                {group.items.map((item) => (
                  <AdminNavLink
                    href={item.href}
                    icon={item.icon}
                    key={item.href}
                  >
                    {item.label}
                  </AdminNavLink>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar" aria-hidden="true">
              {roleLabel.charAt(0)}
            </div>

            <div className="admin-user-copy">
              <strong>{roleLabel}</strong>
              <span>{context.role}</span>
            </div>
          </div>

          <Link className="admin-logout" href="/sair" prefetch={false}>
            Sair da conta
          </Link>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-context">
            <strong>Operação</strong>
            <span>DeliveryReg</span>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-topbar-status">
              <span className="admin-status-dot" aria-hidden="true" />
              <span>Sistema online</span>
            </div>

            <div className="admin-topbar-role">{roleLabel}</div>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
