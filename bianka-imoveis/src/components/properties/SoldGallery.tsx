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
      <ul className="mt-6 grid grid-cols-3 gap-x-2.5 gap-y-5 sm:gap-x-4 md:mt-8 md:gap-y-6 lg:grid-cols-4">
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
                    sizes="(min-width: 1024px) 25vw, 33vw"
                    className="object-cover grayscale-[35%] transition-[transform,filter] duration-700 ease-soft group-hover:scale-[1.03] group-hover:grayscale-0"
                  />
                  <Badges item={item} compact className="absolute left-1.5 top-1.5 md:left-2 md:top-2" />
                </span>
                <span className="mt-1.5 block text-xs font-medium leading-snug text-charcoal md:mt-2 md:text-sm">{title}</span>
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
