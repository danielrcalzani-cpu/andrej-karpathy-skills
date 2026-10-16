"use client";

import Image from "next/image";
import { useState } from "react";
import { LuImages, LuPlay } from "react-icons/lu";
import { statusLabel, type Property, type PropertyStatus } from "@/content/properties";
import { copy } from "@/content/site";
import { propertyWhatsappLink } from "@/lib/whatsapp";
import { CtaLink } from "../CtaLink";
import { Lightbox } from "./Lightbox";
import { getSlides, itemDetails, itemTitle } from "./media";
import { Badges } from "./StatusBadge";

type Filter = "todos" | Exclude<PropertyStatus, "vendido">;
type Open = { item: Property; index: number } | null;

export function ListingsGallery({ items }: { items: Property[] }) {
  const [filter, setFilter] = useState<Filter>("todos");
  const [open, setOpen] = useState<Open>(null);

  const count = (s: Filter) => (s === "todos" ? items.length : items.filter((i) => i.status === s).length);
  const showFilter = count("venda") > 0 && count("aluguel") > 0;
  const shown = filter === "todos" ? items : items.filter((i) => i.status === filter);
  const filters: { id: Filter; label: string }[] = [
    { id: "todos", label: copy.listings.filterAll },
    { id: "venda", label: statusLabel.venda },
    { id: "aluguel", label: statusLabel.aluguel },
  ];

  return (
    <>
      {showFilter && (
        <div role="group" aria-label="Filtrar imóveis" className="mt-10 flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-11 shrink-0 border px-4 text-sm font-semibold transition-colors ${
                filter === f.id
                  ? "border-aubergine bg-aubergine text-ivory"
                  : "border-aubergine/25 text-aubergine hover:border-aubergine"
              }`}
            >
              {f.label} <span className="font-normal opacity-75">({count(f.id)})</span>
            </button>
          ))}
        </div>
      )}

      <ul className="mt-8 grid gap-x-8 gap-y-14 md:grid-cols-2">
        {shown.map((item) => {
          const cover = item.photos[0];
          const title = itemTitle(item);
          const videoIndex = getSlides(item).length - 1;
          const n = item.photos.length;

          return (
            <li key={item.id} className="flex flex-col">
              <button
                type="button"
                onClick={() => setOpen({ item, index: 0 })}
                aria-label={`Ver ${n} ${n === 1 ? "foto" : "fotos"}: ${title} (${statusLabel[item.status].toLowerCase()})`}
                className="group relative block aspect-[4/3] w-full overflow-hidden bg-aubergine/10"
              >
                <Image
                  src={cover.src}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-[1200ms] ease-soft group-hover:scale-[1.03]"
                />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-aubergine-deep/55 via-transparent to-transparent" />
                <Badges item={item} className="absolute left-4 top-4" />
                <span
                  aria-hidden="true"
                  className="absolute bottom-4 right-4 flex items-center gap-3 bg-ivory/95 px-3 py-1.5 text-xs font-semibold text-aubergine"
                >
                  <span className="flex items-center gap-1.5">
                    <LuImages className="size-3.5" />
                    {n} {n === 1 ? "foto" : "fotos"}
                  </span>
                  {item.video && (
                    <span className="flex items-center gap-1.5 border-l border-aubergine/20 pl-3">
                      <LuPlay className="size-3.5" />
                      Vídeo tour
                    </span>
                  )}
                </span>
              </button>

              <div className="flex flex-1 flex-col pt-5">
                <h3 className="font-serif text-[1.75rem] leading-tight text-aubergine">{title}</h3>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[0.95rem]">
                  {itemDetails(item).map((d) => (
                    <div key={d.label} className="contents">
                      <dt className="text-xs font-semibold uppercase leading-6 tracking-[0.14em] text-gold-ink">{d.label}</dt>
                      <dd className={d.missing ? "italic text-muted" : "font-medium text-charcoal"}>{d.value}</dd>
                    </div>
                  ))}
                </dl>
                {item.specs && item.specs.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                    {item.specs.map((s) => (
                      <li key={s} className="flex items-center gap-2 before:size-1 before:rotate-45 before:bg-gold">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
                  <CtaLink ctaId={`interesse-${item.id}`} href={propertyWhatsappLink(item)} icon className="w-full sm:w-auto">
                    {copy.listings.cta}
                  </CtaLink>
                  {item.video && (
                    <button
                      type="button"
                      onClick={() => setOpen({ item, index: videoIndex })}
                      className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-aubergine underline decoration-gold decoration-1 underline-offset-[6px] hover:decoration-aubergine"
                    >
                      <LuPlay aria-hidden="true" className="size-4" />
                      Ver vídeo tour
                      <span className="sr-only">: {title}</span>
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {open && <Lightbox item={open.item} startIndex={open.index} onClose={() => setOpen(null)} />}
    </>
  );
}
