"use client";

/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { useState } from "react";

import { ProductImageFallback } from "@/components/public/ProductImageFallback";

type Props = {
  alt: string;
  className?: string;
  imageClassName?: string;
  name: string;
  priority?: boolean;
  sizes?: string;
  src: string | null;
};

function canOptimizeWithNextImage(src: string) {
  return src.startsWith("/");
}

export function PublicProductImage({
  alt,
  className = "aspect-[4/3]",
  imageClassName = "",
  name,
  priority = false,
  sizes = "(max-width: 640px) 45vw, (max-width: 1024px) 33vw, 25vw",
  src,
}: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const loadFailed = Boolean(src && failedSrc === src);
  const frameClassName = `relative overflow-hidden bg-[var(--surface-muted)] ${className}`;

  if (!src || loadFailed) {
    return <ProductImageFallback className={className} name={name} />;
  }

  if (canOptimizeWithNextImage(src)) {
    return (
      <div className={frameClassName}>
        <Image
          alt={alt}
          className={`object-cover ${imageClassName}`}
          fill
          priority={priority}
          sizes={sizes}
          src={src}
          onError={() => setFailedSrc(src)}
        />
      </div>
    );
  }

  return (
    <div className={frameClassName}>
      <img
        alt={alt}
        className={`h-full w-full object-cover ${imageClassName}`}
        src={src}
        onError={() => setFailedSrc(src)}
      />
    </div>
  );
}
