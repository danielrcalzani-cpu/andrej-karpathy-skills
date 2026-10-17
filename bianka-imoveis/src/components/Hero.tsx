import { LuArrowDown } from "react-icons/lu";
import { copy, site } from "@/content/site";
import { CtaLink } from "./CtaLink";
import { Portrait } from "./Portrait";

export function Hero() {
  const { hero } = copy;

  return (
    <section id="inicio" aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-y-6 px-5 pb-12 pt-5 [grid-template-areas:'photo''name''copy'] sm:px-8 sm:pb-16 sm:pt-10 lg:grid-cols-[7fr_5fr] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-16 lg:gap-y-0 lg:pb-24 lg:pt-20 lg:[grid-template-areas:'name_photo''copy_photo']">
        {/* Retrato: foto larga no topo no celular, vertical à direita no desktop */}
        <div className="relative [grid-area:photo] lg:mt-2">
          <div className="relative aspect-[5/4] overflow-hidden bg-aubergine sm:aspect-[16/10] lg:aspect-[4/5]">
            <Portrait sizes="(min-width: 1024px) 40vw, 100vw" priority />
          </div>
          <div className="absolute bottom-3 left-3 flex items-baseline gap-2 bg-aubergine-deep/90 px-3.5 py-2 text-ivory backdrop-blur-sm lg:-bottom-6 lg:-left-6 lg:block lg:max-w-[13rem] lg:bg-aubergine-deep lg:px-6 lg:py-5 lg:shadow-[0_12px_32px_rgb(42_23_48/0.25)]">
            <p className="font-serif text-3xl leading-none text-gold-light lg:text-6xl">{site.experienceYears}</p>
            <p className="text-sm leading-snug text-ivory/90 lg:mt-2 lg:text-ivory/85">
              <span className="lg:hidden">anos de experiência</span>
              <span className="hidden lg:inline">{hero.experienceLabel}</span>
            </p>
          </div>
        </div>

        <div className="animate-rise [grid-area:name] lg:pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink sm:tracking-[0.28em]">
            {hero.eyebrow}
          </p>
          <h1
            id="hero-title"
            className="mt-2 font-serif text-[2.6rem] leading-[0.98] tracking-[-0.015em] text-aubergine sm:mt-3 sm:text-6xl lg:mt-5 lg:text-[5.4rem] xl:text-[6.2rem]"
          >
            Bianka <em className="italic text-aubergine-soft">Rodrigues</em>
          </h1>
        </div>

        <div className="min-w-0 animate-rise [grid-area:copy] lg:pt-8">
          <p className="font-serif text-[1.45rem] italic leading-snug text-aubergine sm:text-[1.9rem]">{hero.tagline}</p>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted sm:mt-4 sm:text-lg">{hero.text}</p>

          <div id="hero-ctas" className="mt-6 grid gap-3 sm:mt-9 sm:flex sm:flex-wrap">
            <CtaLink ctaId="hero-whatsapp" intent="geral" icon>
              {hero.primaryCta}
            </CtaLink>
            <CtaLink ctaId="hero-imoveis" href="#imoveis" variant="secondary">
              {hero.secondaryCta}
              <LuArrowDown aria-hidden="true" className="ml-1 inline size-4" />
            </CtaLink>
          </div>

          <p className="mt-6 border-t border-line pt-4 text-sm font-medium text-muted sm:mt-7 sm:pt-5">
            {hero.credibility}
          </p>
        </div>
      </div>
    </section>
  );
}
