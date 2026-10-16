import type { IconType } from "react-icons";
import { LuArrowRight, LuKeyRound, LuScale, LuSearch } from "react-icons/lu";
import { copy } from "@/content/site";
import { CtaLink } from "./CtaLink";

const icons: Record<string, IconType> = {
  comprar: LuSearch,
  vender: LuKeyRound,
  avaliacao: LuScale,
};

export function Services() {
  const { services } = copy;

  return (
    <section id="servicos" aria-labelledby="servicos-title" className="bg-ivory">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-gold-ink">
            <span aria-hidden="true" className="h-px w-8 bg-gold" />
            {services.eyebrow}
          </p>
          <h2
            id="servicos-title"
            className="mt-5 font-serif text-[2.2rem] font-normal leading-[1.08] text-aubergine sm:text-5xl"
          >
            {services.headline}
          </h2>
        </div>

        <ul className="mt-14 grid border-t border-aubergine/20 md:grid-cols-3">
          {services.items.map((s, i) => {
            const Icon = icons[s.id];
            return (
              <li
                key={s.id}
                className="flex flex-col border-b border-line py-10 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0 lg:px-10"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg italic text-gold-ink">0{i + 1}</span>
                  <Icon aria-hidden="true" className="size-6 text-aubergine-soft" strokeWidth={1.4} />
                </div>
                <h3 className="mt-8 font-serif text-[1.9rem] font-normal leading-tight text-aubergine">{s.title}</h3>
                <p className="mt-4 flex-1 leading-relaxed text-muted">{s.text}</p>
                <CtaLink ctaId={`servico-${s.id}`} intent={s.intent} variant="text" className="mt-8 self-start">
                  {s.cta}
                  <LuArrowRight
                    aria-hidden="true"
                    className="ml-2 inline size-4 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </CtaLink>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-6 text-muted md:mt-0">
          {services.rentalNote}
          <CtaLink ctaId="servico-locacao" intent="locacao" variant="text">
            {services.rentalCta}
          </CtaLink>
        </p>
      </div>
    </section>
  );
}
