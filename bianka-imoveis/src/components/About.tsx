import Image from "next/image";
import { copy, portrait, site } from "@/content/site";
import { CtaLink } from "./CtaLink";

function PortraitPlaceholder() {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center bg-aubergine">
      <svg viewBox="0 0 200 250" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="#d9bf8c" strokeOpacity="0.35" strokeWidth="0.6">
          <path d="M40 250V110a60 60 0 0 1 120 0v140" />
          <path d="M52 250V112a48 48 0 0 1 96 0v138" strokeOpacity="0.2" />
        </g>
      </svg>
      <span className="relative font-serif text-[5.5rem] font-normal italic leading-none text-gold-light">BR</span>
      <span className="relative mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-ivory/70">
        {site.city} · {site.state}
      </span>
    </div>
  );
}

export function About() {
  const { about } = copy;

  return (
    <section id="sobre" aria-labelledby="sobre-title" className="border-t border-line/70 bg-paper">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:py-28">
        <div className="relative mx-auto w-full max-w-md self-start lg:col-span-5 lg:max-w-none">
          <div aria-hidden="true" className="absolute -bottom-4 -left-4 right-8 top-8 border border-gold/60 sm:-bottom-5 sm:-left-5" />
          <div className="relative aspect-[4/5] overflow-hidden bg-aubergine">
            {portrait.src ? (
              <Image
                src={portrait.src}
                alt={portrait.alt}
                fill
                sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 100vw"
                className="object-cover object-top"
              />
            ) : (
              <PortraitPlaceholder />
            )}
          </div>
        </div>

        <div className="lg:col-span-7 lg:pt-6">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-gold-ink">
            <span aria-hidden="true" className="h-px w-8 bg-gold" />
            {about.eyebrow}
          </p>
          <h2
            id="sobre-title"
            className="mt-5 max-w-2xl font-serif text-[2.2rem] font-normal leading-[1.08] text-aubergine sm:text-5xl lg:text-[3.4rem]"
          >
            {about.headline}
          </h2>

          <div className="mt-8 max-w-xl space-y-5 text-[1.03rem] leading-relaxed text-charcoal/90">
            {about.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <dl className="mt-10 grid max-w-xl grid-cols-3 border-t border-line">
            {about.facts.map((f) => (
              <div
                key={f.label}
                className="flex flex-col-reverse justify-end border-r border-line py-5 pr-3 last:border-r-0 [&:not(:first-child)]:pl-4 sm:[&:not(:first-child)]:pl-6"
              >
                <dt className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted sm:text-xs">
                  {f.label}
                </dt>
                <dd className="font-serif text-[1.9rem] leading-none text-aubergine sm:text-4xl">{f.value}</dd>
              </div>
            ))}
          </dl>

          <CtaLink ctaId="sobre-whatsapp" intent="geral" icon className="mt-10">
            {about.cta}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
