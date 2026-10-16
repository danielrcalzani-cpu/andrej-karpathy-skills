import { copy } from "@/content/site";

export function Process() {
  const { process } = copy;

  return (
    <section aria-labelledby="processo-title" className="border-t border-line/70 bg-ivory">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-gold-ink">
              <span aria-hidden="true" className="h-px w-8 bg-gold" />
              {process.eyebrow}
            </p>
            <h2
              id="processo-title"
              className="mt-5 font-serif text-[2rem] font-normal leading-[1.1] text-aubergine sm:text-[2.6rem]"
            >
              {process.headline}
            </h2>
          </div>

          <ol className="grid gap-8 sm:grid-cols-3 lg:col-span-8 lg:pt-2">
            {process.steps.map((step, i) => (
              <li key={step.title} className="relative border-t border-aubergine/25 pt-6">
                <span
                  aria-hidden="true"
                  className="absolute -top-[5px] left-0 size-[9px] rotate-45 border border-gold bg-ivory"
                />
                <span className="font-serif text-4xl italic leading-none text-gold-ink">{i + 1}</span>
                <h3 className="mt-4 text-[1.05rem] font-semibold leading-snug text-aubergine">{step.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
