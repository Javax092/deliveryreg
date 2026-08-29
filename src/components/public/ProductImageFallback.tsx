export function ProductImageFallback({ className = "aspect-[4/3]", name }: { className?: string; name: string }) {
  return (
    <div
      aria-label={`Imagem indisponível para ${name}`}
      className={`flex w-full items-center justify-center border-b border-slate-100 bg-slate-50 p-4 ${className}`}
      role="img"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-400 shadow-xs">
        DR
      </div>
    </div>
  );
}
