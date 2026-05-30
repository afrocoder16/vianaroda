"use client";

import { useState } from "react";
import { ProductImageFrame } from "@/components/product-image-frame";

type GalleryImage = {
  id: string;
  path: string;
  alt: string | null;
};

export function ProductGallery({
  images,
  productTitle,
}: {
  images: GalleryImage[];
  productTitle: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  return (
    <section className="space-y-4">
      <div className="section-shell relative min-h-[500px] overflow-hidden bg-[#f3f1ff]">
        <ProductImageFrame
          src={activeImage.path}
          alt={activeImage.alt ?? productTitle}
          title={productTitle}
          className="object-cover"
        />
      </div>
      <div className="grid grid-cols-5 gap-3">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`section-shell relative h-24 overflow-hidden bg-[#f3f1ff] ${
              index === activeIndex ? "ring-2 ring-[var(--brand)]" : ""
            }`}
          >
            <ProductImageFrame
              src={image.path}
              alt={image.alt ?? productTitle}
              title={productTitle}
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
