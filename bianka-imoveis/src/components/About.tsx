import { copy } from "@/content/site";
import { CtaLink } from "./CtaLink";

export function About() {
  const { about } = copy;

  return (
    <section id="sobre" aria-labelledby="sobre-title" className="border-t border-line/70 bg-paper">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:py-28">
        <div className="lg:col-span-6">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-gold-ink">
            <span aria-hidden="true" className="h-px w-8 bg-gold" />
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

          <dl className="mt-10 grid max-w-xl grid-cols-3 border-t border-line">
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
          <div className="border border-aubergine/15 bg-ivory p-7 sm:p-10">
            <h3 className="font-serif text-2xl text-aubergine">{about.approachTitle}</h3>
            <ol className="mt-6 space-y-6">
              {about.approach.map((a, i) => (
                <li key={a.title} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-t border-line pt-6 first:border-t-0 first:pt-0">
                  <span className="font-serif text-3xl italic leading-none text-gold-ink">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-aubergine">{a.title}</p>
                    <p className="mt-1 leading-relaxed text-muted">{a.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <CtaLink ctaId="sobre-whatsapp" intent="geral" icon className="mt-8 w-full sm:w-auto">
              {about.cta}
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
