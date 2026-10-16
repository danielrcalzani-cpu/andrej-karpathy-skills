import { LuInfo } from "react-icons/lu";
import { copy } from "@/content/site";
import { visiblePortfolio } from "@/content/portfolio";
import { CtaLink } from "../CtaLink";
import { PortfolioGallery } from "./PortfolioGallery";

export function Portfolio() {
  if (visiblePortfolio.length === 0) return null;

  const { portfolio } = copy;
  const hasDemo = visiblePortfolio.some((i) => i.isDemo);

  return (
    <section id="imoveis-vendidos" aria-labelledby="vendidos-title" className="border-t border-line/70 bg-ivory-deep">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-gold-ink">
              <span aria-hidden="true" className="h-px w-8 bg-gold" />
              {portfolio.eyebrow}
            </p>
            <h2
              id="vendidos-title"
              className="mt-5 font-serif text-[2.3rem] font-normal leading-[1.05] text-aubergine sm:text-5xl lg:text-[3.6rem]"
            >
              {portfolio.headline}
            </h2>
          </div>
          <p className="max-w-md text-lg leading-relaxed text-muted lg:col-span-5 lg:justify-self-end lg:pb-2">
            {portfolio.text}
          </p>
        </div>

        {hasDemo && (
          <p
            role="note"
            className="mt-10 flex items-start gap-3 border border-dashed border-aubergine/40 bg-paper px-4 py-3 text-sm leading-relaxed text-charcoal"
          >
            <LuInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-aubergine" />
            <span>
              <strong className="font-semibold">Demonstração.</strong> {portfolio.demoNotice}
            </span>
          </p>
        )}

        <PortfolioGallery items={visiblePortfolio} />

        <div className="mt-14 flex flex-col items-start gap-4 border-t border-aubergine/20 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md font-serif text-2xl leading-snug text-aubergine">
            Procura algo parecido?
          </p>
          <CtaLink ctaId="portfolio-whatsapp" intent="portfolio" icon className="w-full sm:w-auto">
            {portfolio.cta}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
