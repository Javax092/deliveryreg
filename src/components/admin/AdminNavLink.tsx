"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";

type AdminNavIcon =
  | "dashboard"
  | "orders"
  | "pdv"
  | "cash"
  | "deliveries"
  | "products"
  | "inventory"
  | "customers"
  | "reports";

const icons = {
  dashboard: LayoutDashboard,
  orders: ClipboardList,
  pdv: ShoppingBag,
  cash: WalletCards,
  deliveries: Truck,
  products: Package,
  inventory: Boxes,
  customers: Users,
  reports: BarChart3,
} satisfies Record<AdminNavIcon, React.ComponentType<{ size?: number }>>;

export function AdminNavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: AdminNavIcon;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive =
    pathname === href ||
    (href !== "/painel" && pathname.startsWith(`${href}/`));

  const Icon = icons[icon];

  return (
    <Link
      href={href}
      className={`admin-navigation-link ${
        isActive ? "admin-navigation-link-active" : ""
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="admin-navigation-icon" aria-hidden="true">
        <Icon size={17} />
      </span>

      <span>{children}</span>
    </Link>
  );
}

export type { AdminNavIcon };
