"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  title?: string;
};

export function ProductImageFrame({
  src,
  alt,
  className,
  fill = true,
  sizes,
  priority,
  title,
}: Props) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex h-full w-full items-end overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(83,74,183,0.35),_transparent_45%),linear-gradient(135deg,#f6f3ff,#e7fbf4)] p-4 ${className ?? ""}`}
      >
        <div className="rounded-2xl bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6f68b6]">
            Vinaroda
          </p>
          {title ? (
            <p className="mt-1 line-clamp-2 max-w-[14rem] text-sm font-bold text-[#2c2c2a]">
              {title}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
