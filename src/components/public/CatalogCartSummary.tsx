"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { readPublicCart, type PublicCartItem } from "@/modules/public-cart/cart";
import { formatBRL } from "@/modules/shared/money/money";

export function CatalogCartSummary({ sourceCode }: { sourceCode?: string }) {
  const [items, setItems] = useState<PublicCartItem[]>([]);

  useEffect(() => {
    function loadCart() {
      setItems(readPublicCart());
    }

    loadCart();
    window.addEventListener("storage", loadCart);
    window.addEventListener("deliveryreg-cart-updated", loadCart);

    return () => {
      window.removeEventListener("storage", loadCart);
      window.removeEventListener("deliveryreg-cart-updated", loadCart);
    };
  }, []);

  const summary = useMemo(
    () => ({
      count: items.length,
      totalCents: items.reduce((total, item) => total + item.estimatedAmountCents, 0)
    }),
    [items]
  );

  if (summary.count === 0) {
    return null;
  }

  const href = sourceCode ? `/carrinho?origem=${encodeURIComponent(sourceCode)}` : "/carrinho";

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border-default)] bg-white/95 px-4 py-3 shadow-[var(--shadow-md)] backdrop-blur">
      <Link
        className="mx-auto grid min-h-14 max-w-2xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-md)] border border-[var(--success)] bg-white px-4 text-sm text-[var(--text-primary)] shadow-[var(--shadow-sm)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-600)] focus:ring-offset-2 sm:flex sm:min-h-12 sm:justify-between"
        href={href}
      >
        <span className="min-w-0">
          <span className="block truncate font-semibold">
            Carrinho • {summary.count} {summary.count === 1 ? "item" : "itens"}
          </span>
          <span className="block text-base font-semibold text-[var(--text-primary)] sm:hidden">
            {formatBRL(summary.totalCents)}
          </span>
        </span>
        <span className="hidden font-semibold sm:inline">{formatBRL(summary.totalCents)}</span>
        <span className="rounded-[var(--radius-md)] bg-[var(--success)] px-3 py-2 font-semibold text-white">
          Ver carrinho
        </span>
      </Link>
    </div>
  );
}
