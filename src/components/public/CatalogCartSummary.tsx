"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
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
    <div className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 sm:px-4">
      <Link
        className="mx-auto grid min-h-16 max-w-2xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--brand-800)] bg-[var(--brand-900)] px-4 text-sm text-white shadow-[var(--shadow-md)] transition hover:bg-[var(--brand-800)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-600)] focus:ring-offset-2 sm:min-h-14 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
        href={href}
      >
        <span
          aria-hidden="true"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/12 text-white"
        >
          <ShoppingBag className="h-5 w-5" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-semibold text-white">
            Carrinho • {summary.count} {summary.count === 1 ? "item" : "itens"}
          </span>
          <span className="block text-base font-bold text-white sm:hidden">
            {formatBRL(summary.totalCents)}
          </span>
        </span>
        <span className="hidden font-bold text-white sm:inline">{formatBRL(summary.totalCents)}</span>
        <span className="inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-md)] bg-white px-3 font-semibold text-[var(--brand-900)]">
          Ver carrinho
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}
