import { Cookie, Milk, Package } from "lucide-react";

export function ProductImageFallback({
  className = "aspect-[4/3]",
  name,
}: {
  className?: string;
  name: string;
}) {
  return (
    <div
      aria-label={`Imagem indisponível para ${name}`}
      className={`flex w-full items-center justify-center border-b border-[var(--border-soft)] bg-[linear-gradient(135deg,#f8faf8_0%,#eef4ef_100%)] p-3 ${className}`}
      role="img"
    >
      <div className="grid max-w-full place-items-center gap-2 text-center">
        <div className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] border border-white/80 bg-white/75 text-[var(--brand-700)] shadow-[var(--shadow-xs)]">
          {renderFallbackIcon(name)}
        </div>
      </div>
    </div>
  );
}

function renderFallbackIcon(name: string) {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("queijo")) {
    return <Milk aria-hidden="true" className="h-5 w-5" />;
  }

  if (normalizedName.includes("tapioca") || normalizedName.includes("farinha")) {
    return <Package aria-hidden="true" className="h-5 w-5" />;
  }

  if (normalizedName.includes("moleque")) {
    return <Cookie aria-hidden="true" className="h-5 w-5" />;
  }

  return <Package aria-hidden="true" className="h-5 w-5" />;
}
