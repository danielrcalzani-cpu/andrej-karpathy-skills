import { copy } from "@/content/site";

export function Process() {
  const { process } = copy;

  return (
    <section aria-labelledby="processo-title" className="border-t border-line/70 bg-ivory">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:py-24">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-ink">
              {process.eyebrow}
            </p>
            <h2
              id="processo-title"
              className="mt-5 font-serif text-[2rem] font-normal leading-[1.1] text-aubergine sm:text-[2.6rem]"
            >
              {process.headline}
            </h2>
          </div>

          <ol className="grid gap-6 sm:grid-cols-3 sm:gap-8 lg:col-span-8 lg:pt-2">
            {process.steps.map((step) => (
              <li key={step.title} className="border-t border-aubergine/25 pt-5 sm:pt-6">
                <h3 className="text-[1.05rem] font-semibold leading-snug text-aubergine">{step.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
