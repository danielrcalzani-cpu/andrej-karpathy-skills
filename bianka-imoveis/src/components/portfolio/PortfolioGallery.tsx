"use client";

import Image from "next/image";
import { useState } from "react";
import { LuImages, LuPlay } from "react-icons/lu";
import type { PortfolioItem } from "@/content/portfolio";
import { Lightbox } from "./Lightbox";
import { getSlides, itemMeta, itemTitle } from "./media";
import { StatusBadge } from "./StatusBadge";

type Open = { item: PortfolioItem; index: number } | null;

export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  const [open, setOpen] = useState<Open>(null);

  return (
    <>
      <ul className="mt-12 grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const featured = i === 0 && items.length > 2;
          const cover = item.photos[0];
          const title = itemTitle(item);
          const meta = itemMeta(item);
          const videoIndex = getSlides(item).length - 1;

          return (
            <li key={item.id} className={`flex flex-col ${featured ? "md:col-span-2 lg:row-span-2" : ""}`}>
              <button
                type="button"
                onClick={() => setOpen({ item, index: 0 })}
                aria-label={`Ver ${item.photos.length} ${item.photos.length === 1 ? "foto" : "fotos"}: ${title}${item.isDemo ? " (demonstração)" : ""}`}
                className={`group relative block w-full overflow-hidden bg-aubergine/10 ${
                  featured ? "aspect-[4/3] md:aspect-[16/10] lg:aspect-auto lg:min-h-[30rem] lg:flex-1" : "aspect-[4/3] sm:aspect-[4/5]"
                }`}
              >
                <Image
                  src={cover.src}
                  alt=""
                  fill
                  sizes={featured ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
                  className="object-cover transition-transform duration-[1200ms] ease-soft group-hover:scale-[1.03]"
                />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-aubergine-deep/55 via-transparent to-transparent" />
                <StatusBadge item={item} className="absolute left-4 top-4" />
                <span
                  aria-hidden="true"
                  className="absolute bottom-4 right-4 flex items-center gap-3 bg-ivory/95 px-3 py-1.5 text-xs font-semibold text-aubergine"
                >
                  <span className="flex items-center gap-1.5">
                    <LuImages className="size-3.5" />
                    {item.photos.length}
                  </span>
                  {item.video && (
                    <span className="flex items-center gap-1.5 border-l border-aubergine/20 pl-3">
                      <LuPlay className="size-3.5" />
                      Vídeo
                    </span>
                  )}
                </span>
              </button>

              <div className="pt-5">
                {meta && (
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">{meta}</p>
                )}
                <h3 className={`mt-2 font-serif font-normal leading-tight text-aubergine ${featured ? "text-3xl" : "text-2xl"}`}>
                  {title}
                </h3>
                {item.specs && item.specs.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                    {item.specs.map((s) => (
                      <li key={s} className="flex items-center gap-2 before:size-1 before:rotate-45 before:bg-gold">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
                {item.video && (
                  <button
                    type="button"
                    onClick={() => setOpen({ item, index: videoIndex })}
                    className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-aubergine underline decoration-gold decoration-1 underline-offset-[6px] hover:decoration-aubergine"
                  >
                    <LuPlay aria-hidden="true" className="size-4" />
                    Assistir ao vídeo
                    <span className="sr-only">: {title}</span>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {open && <Lightbox item={open.item} startIndex={open.index} onClose={() => setOpen(null)} />}
    </>
  );
}
