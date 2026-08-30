"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Props = {
  initialValue?: string;
};

export function CatalogSearch({ initialValue = "" }: Props) {
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const nextValue = value.trim();

      if (nextValue) {
        params.set("busca", nextValue);
      } else {
        params.delete("busca");
      }

      const query = params.toString();
      const nextHref = query ? `${pathname}?${query}` : pathname;
      const currentHref = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

      if (nextHref !== currentHref) {
        startTransition(() => {
          router.replace(nextHref, { scroll: false });
        });
      }
    }, 280);

    return () => window.clearTimeout(timeout);
  }, [pathname, router, searchParams, value]);

  function clearSearch() {
    setValue("");
  }

  return (
    <div className="relative" role="search">
      <label className="sr-only" htmlFor="busca">
        Buscar produto
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]"
      />
      <input
        className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-10 text-base text-[var(--text-primary)] shadow-[var(--shadow-xs)] placeholder:text-[var(--text-subtle)] transition focus:border-[var(--brand-700)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]"
        id="busca"
        name="busca"
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar queijo, farinha, tapioca..."
        type="search"
        value={value}
      />
      {value ? (
        <button
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
          onClick={clearSearch}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
      {isPending ? (
        <span className="sr-only" role="status">
          Atualizando produtos
        </span>
      ) : null}
    </div>
  );
}
