import { LuArrowRight } from "react-icons/lu";
import { copy } from "@/content/site";
import { whatsappLink } from "@/lib/whatsapp";
import { CtaLink } from "./CtaLink";

export function Services() {
  const { services } = copy;

  return (
    <section id="servicos" aria-labelledby="servicos-title" className="bg-ivory">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-ink">{services.eyebrow}</p>
          <h2
            id="servicos-title"
            className="mt-4 font-serif text-[2.1rem] font-normal leading-[1.08] text-aubergine sm:mt-5 sm:text-5xl"
          >
            {services.headline}
          </h2>
        </div>

        {/* Um painel; cada serviço é um bloco inteiro clicável (empilhado no celular, 3 colunas no computador). */}
        <ul className="mt-7 grid border border-aubergine/15 bg-paper sm:mt-10 md:mt-14 md:grid-cols-3">
          {services.items.map((s) => (
            <li key={s.id} className="border-t border-aubergine/10 first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0">
              <a
                href={whatsappLink(s.intent)}
                target="_blank"
                rel="noopener noreferrer"
                data-cta={`servico-${s.id}`}
                data-intent={s.intent}
                className="group flex h-full flex-col p-5 transition-colors duration-300 hover:bg-ivory sm:p-7 lg:p-9"
              >
                <h3 className="font-serif text-[1.55rem] leading-tight text-aubergine md:text-[1.85rem]">{s.title}</h3>
                <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-muted md:mt-3 md:text-base">{s.text}</p>
                <span className="mt-5 flex items-center justify-between gap-4 md:mt-8">
                  <span className="font-semibold text-aubergine">{s.cta}</span>
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-aubergine text-ivory transition-colors duration-300 group-hover:bg-gold-light group-hover:text-aubergine-deep"
                  >
                    <LuArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </span>
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="on-dark mt-3 flex flex-col gap-4 bg-aubergine p-5 text-ivory sm:p-7 md:mt-4 md:flex-row md:items-center md:justify-between lg:px-9">
          <p className="font-serif text-[1.45rem] leading-snug md:text-[1.7rem]">{services.rentalNote}</p>
          <CtaLink ctaId="servico-locacao" intent="locacao" variant="light" icon className="w-full !py-3.5 md:w-auto">
            {services.rentalCta}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
