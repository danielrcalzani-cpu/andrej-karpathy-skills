import { LuArrowRight } from "react-icons/lu";
import { copy } from "@/content/site";
import { CtaLink } from "./CtaLink";

export function Services() {
  const { services } = copy;

  return (
    <section id="servicos" aria-labelledby="servicos-title" className="bg-ivory">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-ink">
            {services.eyebrow}
          </p>
          <h2
            id="servicos-title"
            className="mt-5 font-serif text-[2.2rem] font-normal leading-[1.08] text-aubergine sm:text-5xl"
          >
            {services.headline}
          </h2>
        </div>

        <ul className="mt-8 grid sm:mt-14 border-t border-aubergine/20 md:grid-cols-3">
          {services.items.map((s) => {
            return (
              <li
                key={s.id}
                className="flex flex-col border-b border-line py-7 sm:py-10 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0 lg:px-10"
              >
                <h3 className="font-serif text-[1.75rem] sm:text-[1.9rem] font-normal leading-tight text-aubergine">{s.title}</h3>
                <p className="mt-3 flex-1 leading-relaxed text-muted">{s.text}</p>
                <CtaLink ctaId={`servico-${s.id}`} intent={s.intent} variant="text" className="mt-4 self-start sm:mt-8">
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
