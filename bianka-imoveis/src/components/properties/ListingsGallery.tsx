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
        <div role="group" aria-label="Filtrar imóveis" className="mt-8 flex gap-1.5 sm:mt-10 sm:gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-11 flex-1 border px-1.5 text-[0.8rem] font-semibold whitespace-nowrap transition-colors sm:flex-none sm:px-4 sm:text-sm ${
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

      {/* Mesma grade de 2 colunas do computador; no celular os cartões ficam compactos. */}
      {/* Cada cartão ocupa 4 linhas da grade (foto, título, detalhes, botões) via subgrid,
          para que essas partes fiquem alinhadas entre cartões lado a lado. */}
      <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-0 sm:gap-x-5 md:mt-8 md:gap-x-8">
        {shown.map((item) => {
          const cover = item.photos[0];
          const title = itemTitle(item);
          const videoIndex = getSlides(item).length - 1;
          const n = item.photos.length;

          return (
            <li key={item.id} className="row-span-4 grid min-w-0 grid-rows-subgrid gap-y-0 pb-8 md:pb-14">
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
                  sizes="50vw"
                  className="object-cover transition-transform duration-[1200ms] ease-soft group-hover:scale-[1.03]"
                />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-aubergine-deep/55 via-transparent to-transparent" />
                <Badges item={item} compact className="absolute left-2 top-2 md:left-4 md:top-4" />
                <span
                  aria-hidden="true"
                  className="absolute bottom-2 right-2 flex items-center gap-2 bg-ivory/95 px-2 py-1 text-xs font-semibold text-aubergine md:bottom-4 md:right-4 md:gap-3 md:px-3 md:py-1.5"
                >
                  <span className="flex items-center gap-1.5">
                    <LuImages className="size-3.5" />
                    {n}
                    <span className="hidden md:inline">{n === 1 ? "foto" : "fotos"}</span>
                  </span>
                  {item.video && (
                    <span className="flex items-center gap-1.5 border-l border-aubergine/20 pl-2 md:pl-3">
                      <LuPlay className="size-3.5" />
                      <span className="hidden md:inline">Vídeo tour</span>
                    </span>
                  )}
                </span>
              </button>

              <h3 className="pt-3 font-serif md:pt-5 text-[1.15rem] leading-tight text-aubergine sm:text-[1.4rem] md:text-[1.75rem]">{title}</h3>
                <div>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[0.8rem] md:mt-3 md:gap-x-4 md:gap-y-1 md:text-[0.95rem]">
                  {itemDetails(item).map((d) => (
                    <div key={d.label} className="contents">
                      <dt className="text-[0.6875rem] font-semibold uppercase leading-5 tracking-[0.08em] text-gold-ink md:text-xs md:leading-6 md:tracking-[0.14em]">{d.label}</dt>
                      <dd className={d.missing ? "italic text-muted" : "font-medium text-charcoal"}>{d.value}</dd>
                    </div>
                  ))}
                </dl>
                {item.specs && item.specs.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.8rem] text-muted md:mt-3 md:gap-x-4 md:gap-y-1 md:text-sm">
                    {item.specs.map((s) => (
                      <li key={s}>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
                </div>

                <div className="flex flex-col gap-1 pt-4 md:pt-6 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-6">
                  <CtaLink ctaId={`interesse-${item.id}`} href={propertyWhatsappLink(item)} icon className="min-h-11 w-full !gap-1.5 !px-2.5 !py-2.5 text-[0.8rem] leading-tight md:!gap-2.5 md:!px-6 md:!py-3.5 md:text-[0.95rem] lg:w-auto">
                    <span className="md:hidden">
                      Tenho interesse<span className="sr-only"> neste imóvel</span>
                    </span>
                    <span className="hidden md:inline">{copy.listings.cta}</span>
                  </CtaLink>
                  {item.video && (
                    <button
                      type="button"
                      onClick={() => setOpen({ item, index: videoIndex })}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 text-[0.8rem] font-semibold text-aubergine underline md:gap-2 md:text-sm decoration-gold decoration-1 underline-offset-[6px] hover:decoration-aubergine"
                    >
                      <LuPlay aria-hidden="true" className="size-4" />
                      Ver vídeo tour
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
