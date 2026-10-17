import { soldProperties } from "@/content/properties";
import { copy } from "@/content/site";
import { CtaLink } from "../CtaLink";
import { SoldGallery } from "./SoldGallery";

export function SoldProperties() {
  if (soldProperties.length === 0) return null;
  const c = copy.sold;

  return (
    <section id="vendidos" aria-labelledby="vendidos-title" className="border-t border-line/70 bg-paper">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-ink">
              {c.eyebrow}
            </p>
            <h2 id="vendidos-title" className="mt-4 font-serif text-[1.9rem] leading-tight text-aubergine sm:text-4xl">
              {c.headline}
            </h2>
            <p className="mt-2 text-muted">{c.text}</p>
          </div>
          <CtaLink ctaId="vendidos-whatsapp" intent="portfolio" variant="text" className="self-start md:self-auto">
            {c.cta}
          </CtaLink>
        </div>
        {soldProperties.some((i) => i.isDemo) && <p className="mt-4 text-sm italic text-muted">{c.demoNotice}</p>}
        <SoldGallery items={soldProperties} />
      </div>
    </section>
  );
}
