import Image from "next/image";
import { copy, heroImage } from "@/content/site";
import { ArchitecturalArt } from "./ArchitecturalArt";
import { CtaLink } from "./CtaLink";

export function Hero() {
  const { hero } = copy;
  const [before, after = ""] = hero.headline.split(hero.headlineEmphasis);

  return (
    <section id="inicio" aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-9 sm:px-8 sm:pt-14 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-20">
        <div className="min-w-0 animate-rise lg:col-span-6 lg:pr-6 lg:pt-10 xl:col-span-6">
          <p className="flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-ink sm:text-xs sm:tracking-[0.28em]">
            <span aria-hidden="true" className="hidden h-px w-8 bg-gold sm:block" />
            {hero.eyebrow}
          </p>

          <h1
            id="hero-title"
            className="mt-5 font-serif text-[2.45rem] font-normal leading-[1.04] tracking-[-0.015em] text-aubergine sm:text-6xl lg:text-[4.1rem] xl:text-[4.7rem]"
          >
            {hero.headline.includes(hero.headlineEmphasis) ? (
              <>
                {before}
                <em className="font-normal italic text-aubergine-soft">{hero.headlineEmphasis}</em>
                {after}
              </>
            ) : (
              hero.headline
            )}
          </h1>

          <p className="mt-5 max-w-xl text-[1.04rem] leading-relaxed text-muted sm:mt-7 sm:text-lg">
            {hero.text}
          </p>

          <div id="hero-ctas" className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap">
            <CtaLink ctaId="hero-comprar" intent="comprar" icon>
              {hero.primaryCta}
            </CtaLink>
            <CtaLink ctaId="hero-vender" intent="vender" variant="secondary">
              {hero.secondaryCta}
            </CtaLink>
          </div>

          <p className="mt-7 flex flex-wrap gap-x-2 gap-y-1 border-t border-line pt-5 text-[0.8rem] font-medium tracking-[0.04em] text-muted sm:text-sm">
            {hero.credibility.split(" · ").map((part, i) => (
              <span key={part} className="whitespace-nowrap">
                {i > 0 && <span aria-hidden="true" className="mr-2 text-gold">·</span>}
                {part}
              </span>
            ))}
          </p>
        </div>

        <div className="relative lg:col-span-6 xl:col-span-6">
          {/* thin offset frame */}
          <div aria-hidden="true" className="absolute -right-3 -top-3 bottom-8 left-8 border border-gold/60 sm:-right-5 sm:-top-5 lg:left-12" />
          <div className="relative aspect-[4/3] overflow-hidden bg-aubergine-deep sm:aspect-[16/11] lg:aspect-[4/5]">
            {heroImage.src ? (
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <ArchitecturalArt className="absolute inset-0 size-full" />
            )}
          </div>
          <p
            aria-hidden="true"
            className="absolute -left-1 bottom-0 hidden origin-bottom-left -rotate-90 text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-gold-ink lg:block"
          >
            Venda · Locação · Avaliação
          </p>
        </div>
      </div>
    </section>
  );
}
