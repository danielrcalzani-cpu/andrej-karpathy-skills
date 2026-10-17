import { LuInfo } from "react-icons/lu";
import { listings } from "@/content/properties";
import { copy } from "@/content/site";
import { CtaLink } from "../CtaLink";
import { ListingsGallery } from "./ListingsGallery";

export function Listings() {
  const c = copy.listings;
  const hasDemo = listings.some((i) => i.isDemo);

  return (
    <section id="imoveis" aria-labelledby="imoveis-title" className="border-t border-line/70 bg-ivory-deep">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-ink">
              {c.eyebrow}
            </p>
            <h2
              id="imoveis-title"
              className="mt-5 font-serif text-[2.3rem] font-normal leading-[1.05] text-aubergine sm:text-5xl lg:text-[3.6rem]"
            >
              {c.headline}
            </h2>
          </div>
          <p className="max-w-md text-lg leading-relaxed text-muted lg:col-span-5 lg:justify-self-end lg:pb-2">{c.text}</p>
        </div>

        {hasDemo && (
          <p
            role="note"
            className="mt-8 flex items-start gap-3 border border-dashed border-aubergine/40 bg-paper px-4 py-3 text-sm leading-relaxed text-charcoal"
          >
            <LuInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-aubergine" />
            <span>
              <strong className="font-semibold">Demonstração.</strong> {c.demoNotice}
            </span>
          </p>
        )}

        {listings.length > 0 ? (
          <ListingsGallery items={listings} />
        ) : (
          <div className="mt-12 border border-aubergine/20 bg-paper px-6 py-12 text-center sm:px-12">
            <p className="font-serif text-3xl text-aubergine">{c.emptyTitle}</p>
            <p className="mx-auto mt-3 max-w-md text-muted">{c.emptyText}</p>
            <CtaLink ctaId="imoveis-vazio" intent="imoveis" icon className="mt-8">
              {c.emptyCta}
            </CtaLink>
          </div>
        )}

        {listings.length > 0 && (
          <p className="mt-10 border-t border-aubergine/20 pt-6 sm:mt-14 sm:pt-8">
            <CtaLink ctaId="imoveis-outros" intent="imoveis" variant="text">
              {c.moreCta}
            </CtaLink>
          </p>
        )}
      </div>
    </section>
  );
}
