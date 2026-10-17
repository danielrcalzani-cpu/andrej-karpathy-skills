import { LuArrowRight } from "react-icons/lu";
import { copy } from "@/content/site";
import { CtaLink } from "./CtaLink";

/** No celular o link vira um botão largo, fácil de tocar; a partir de 768px volta a ser link sublinhado. */
const mobileButton =
  "max-md:w-full max-md:justify-between max-md:border max-md:border-aubergine/30 max-md:bg-ivory max-md:px-4 max-md:no-underline max-md:hover:border-aubergine " +
  // o texto e a seta ficam no mesmo <span>: espalha os dois nas pontas do botão
  "max-md:[&>span:first-child]:flex max-md:[&>span:first-child]:w-full max-md:[&>span:first-child]:items-center max-md:[&>span:first-child]:justify-between";

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
            className="mt-4 font-serif text-[2.1rem] font-normal leading-[1.08] text-aubergine sm:mt-5 sm:text-5xl"
          >
            {services.headline}
          </h2>
        </div>

        <ul className="mt-7 grid gap-3 sm:mt-10 md:mt-14 md:grid-cols-3 md:gap-0 md:border-t md:border-aubergine/20">
          {services.items.map((s) => (
            <li
              key={s.id}
              className="flex flex-col border border-aubergine/15 bg-paper p-5 md:border-0 md:border-r md:border-line md:bg-transparent md:px-8 md:py-10 md:first:pl-0 md:last:border-r-0 md:last:pr-0 lg:px-10"
            >
              <h3 className="font-serif text-[1.5rem] font-normal leading-tight text-aubergine md:text-[1.9rem]">{s.title}</h3>
              <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-muted md:mt-3 md:text-base">{s.text}</p>
              <CtaLink ctaId={`servico-${s.id}`} intent={s.intent} variant="text" className={`mt-4 self-start md:mt-8 ${mobileButton}`}>
                {s.cta}
                <LuArrowRight
                  aria-hidden="true"
                  className="ml-2 inline size-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </CtaLink>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex flex-col gap-3 bg-aubergine/[0.06] p-5 md:mt-0 md:flex-row md:flex-wrap md:items-center md:gap-x-3 md:gap-y-1 md:border-t md:border-line md:bg-transparent md:p-0 md:pt-6">
          <p className="font-medium text-aubergine md:font-normal md:text-muted">{services.rentalNote}</p>
          <CtaLink ctaId="servico-locacao" intent="locacao" variant="text" className={mobileButton}>
            {services.rentalCta}
            <LuArrowRight aria-hidden="true" className="ml-2 inline size-4 md:hidden" />
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
