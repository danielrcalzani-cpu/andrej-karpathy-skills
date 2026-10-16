"use client";

import Image from "next/image";
import { useState } from "react";
import type { Property } from "@/content/properties";
import { Lightbox } from "./Lightbox";
import { itemTitle } from "./media";
import { Badges } from "./StatusBadge";

/** Grade compacta de imóveis já vendidos — apoio à credibilidade. */
export function SoldGallery({ items }: { items: Property[] }) {
  const [open, setOpen] = useState<Property | null>(null);

  return (
    <>
      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const title = itemTitle(item);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setOpen(item)}
                aria-label={`Ver fotos: ${title} (vendido)`}
                className="group block w-full text-left"
              >
                <span className="relative block aspect-square overflow-hidden bg-aubergine/10">
                  <Image
                    src={item.photos[0].src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="object-cover grayscale-[35%] transition-[transform,filter] duration-700 ease-soft group-hover:scale-[1.03] group-hover:grayscale-0"
                  />
                  <Badges item={item} className="absolute left-2 top-2 scale-90 origin-top-left" />
                </span>
                <span className="mt-2 block text-sm font-medium leading-snug text-charcoal">{title}</span>
                {item.neighborhood && <span className="block text-xs text-muted">{item.neighborhood}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {open && <Lightbox item={open} startIndex={0} onClose={() => setOpen(null)} />}
    </>
  );
}
