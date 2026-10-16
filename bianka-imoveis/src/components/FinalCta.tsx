import { FaInstagram } from "react-icons/fa6";
import { copy, site } from "@/content/site";
import { CtaLink } from "./CtaLink";

export function FinalCta() {
  const { final } = copy;

  return (
    <section id="contato" aria-labelledby="contato-title" className="on-dark relative overflow-hidden bg-aubergine text-ivory">
      <svg
        aria-hidden="true"
        viewBox="0 0 600 600"
        className="pointer-events-none absolute -right-40 top-1/2 h-[140%] -translate-y-1/2 opacity-60 sm:-right-24"
      >
        <g fill="none" stroke="#d9bf8c" strokeWidth="0.8">
          <path d="M120 600V300a180 180 0 0 1 360 0v300" strokeOpacity="0.45" />
          <path d="M160 600V304a140 140 0 0 1 280 0v296" strokeOpacity="0.25" />
          <path d="M200 600V308a100 100 0 0 1 200 0v292" strokeOpacity="0.15" />
          <line x1="0" y1="560" x2="600" y2="560" strokeOpacity="0.3" />
        </g>
      </svg>

      <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-gold-light">
          <span aria-hidden="true" className="h-px w-8 bg-gold-light" />
          {site.city}, {site.state} · {site.creci}
        </p>
        <h2
          id="contato-title"
          className="mt-6 max-w-3xl font-serif text-[2.5rem] font-normal leading-[1.04] sm:text-6xl lg:text-7xl"
        >
          {final.headline}
        </h2>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/80">{final.text}</p>

        <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10">
          <CtaLink ctaId="final-whatsapp" intent="geral" variant="light" icon className="w-full sm:w-auto">
            {final.primaryCta}
          </CtaLink>
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="final-instagram"
            className="inline-flex items-center gap-2.5 py-2 font-semibold text-ivory underline decoration-gold-light/60 decoration-1 underline-offset-[6px] transition-colors hover:decoration-ivory"
          >
            <FaInstagram aria-hidden="true" className="size-5" />
            {final.secondaryCta}
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
