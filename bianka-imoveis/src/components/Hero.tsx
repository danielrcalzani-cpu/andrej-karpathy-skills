import { LuArrowDown } from "react-icons/lu";
import { copy, site } from "@/content/site";
import { CtaLink } from "./CtaLink";
import { Portrait } from "./Portrait";

export function Hero() {
  const { hero } = copy;

  return (
    <section id="inicio" aria-labelledby="hero-title" className="relative overflow-hidden">
      <div
        className="mx-auto grid max-w-7xl grid-cols-[6.5rem_1fr] items-center gap-x-5 gap-y-7 px-5 pb-16 pt-8 [grid-template-areas:'photo_name''copy_copy'] sm:grid-cols-[9rem_1fr] sm:gap-x-8 sm:px-8 sm:pt-14 lg:grid-cols-[7fr_5fr] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-16 lg:gap-y-0 lg:pb-24 lg:pt-20 lg:[grid-template-areas:'name_photo''copy_photo']"
      >
        {/* Retrato: miniatura ao lado do nome no celular, grande à direita no desktop */}
        <div className="relative [grid-area:photo] lg:mt-2">
          <div aria-hidden="true" className="absolute -bottom-2 -left-2 right-3 top-3 border border-gold/60 lg:-bottom-5 lg:-left-5 lg:right-8 lg:top-8" />
          <div className="relative aspect-[4/5] overflow-hidden bg-aubergine">
            <Portrait sizes="(min-width: 1024px) 40vw, 144px" priority />
          </div>
          <div className="absolute -bottom-6 -left-6 hidden max-w-[13rem] bg-aubergine-deep px-6 py-5 text-ivory shadow-[0_12px_32px_rgb(42_23_48/0.25)] lg:block">
            <p className="font-serif text-6xl leading-none text-gold-light">{site.experienceYears}</p>
            <p className="mt-2 text-sm leading-snug text-ivory/85">{hero.experienceLabel}</p>
          </div>
        </div>

        <div className="animate-rise [grid-area:name] lg:pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink sm:tracking-[0.28em]">
            {hero.eyebrow}
          </p>
          <h1
            id="hero-title"
            className="mt-3 font-serif text-[2.55rem] leading-[0.98] tracking-[-0.015em] text-aubergine sm:text-6xl lg:mt-5 lg:text-[5.4rem] xl:text-[6.2rem]"
          >
            Bianka <em className="italic text-aubergine-soft">Rodrigues</em>
          </h1>
        </div>

        <div className="min-w-0 animate-rise [grid-area:copy] lg:pt-8">
          <p className="font-serif text-2xl italic leading-snug text-aubergine sm:text-[1.9rem]">{hero.tagline}</p>
          <p className="mt-4 max-w-xl text-[1.04rem] leading-relaxed text-muted sm:text-lg">{hero.text}</p>

          <div id="hero-ctas" className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap">
            <CtaLink ctaId="hero-whatsapp" intent="geral" icon>
              {hero.primaryCta}
            </CtaLink>
            <CtaLink ctaId="hero-imoveis" href="#imoveis" variant="secondary">
              {hero.secondaryCta}
              <LuArrowDown aria-hidden="true" className="ml-1 inline size-4" />
            </CtaLink>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 text-sm font-medium text-muted">
            {hero.credibility.split(" · ").map((part) => (
              <li key={part} className="flex items-center gap-2 whitespace-nowrap">
                <span aria-hidden="true" className="size-1.5 rotate-45 bg-gold" />
                {part}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
