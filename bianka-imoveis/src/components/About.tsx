import { copy } from "@/content/site";
import { CtaLink } from "./CtaLink";

export function About() {
  const { about } = copy;

  return (
    <section id="sobre" aria-labelledby="sobre-title" className="border-t border-line/70 bg-paper">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
        <div className="lg:col-span-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-ink">
            {about.eyebrow}
          </p>
          <h2
            id="sobre-title"
            className="mt-5 max-w-2xl font-serif text-[2.2rem] font-normal leading-[1.08] text-aubergine sm:text-5xl lg:text-[3.2rem]"
          >
            {about.headline}
          </h2>

          <div className="mt-8 max-w-xl space-y-5 text-[1.03rem] leading-relaxed text-charcoal/90">
            {about.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <dl className="mt-8 grid sm:mt-10 max-w-xl grid-cols-3 border-t border-line">
            {about.facts.map((f) => (
              <div
                key={f.label}
                className="flex flex-col-reverse justify-end border-r border-line py-5 pr-3 last:border-r-0 [&:not(:first-child)]:pl-4 sm:[&:not(:first-child)]:pl-6"
              >
                <dt className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{f.label}</dt>
                <dd className="font-serif text-[1.9rem] leading-none text-aubergine sm:text-4xl">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-6 lg:pt-14">
          <div className="sm:border sm:border-aubergine/15 sm:bg-ivory sm:p-10">
            <h3 className="font-serif text-2xl text-aubergine">{about.approachTitle}</h3>
            <ul className="mt-5 space-y-5 sm:mt-6 sm:space-y-6">
              {about.approach.map((a) => (
                <li key={a.title} className="border-t border-line pt-5 first:border-t-0 first:pt-0 sm:pt-6">
                  <p className="font-semibold text-aubergine">{a.title}</p>
                  <p className="mt-1 leading-relaxed text-muted">{a.text}</p>
                </li>
              ))}
            </ul>
            <CtaLink ctaId="sobre-whatsapp" intent="geral" icon className="mt-8 w-full sm:w-auto">
              {about.cta}
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
