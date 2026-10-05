import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { families } from "@/data/collections";

export default function ProductUniverse() {
  return (
    <section id="produtos" aria-labelledby="universo-title" className="bg-sand py-16 md:py-36">
      <div className="container-x">
        <SectionHeading
          id="universo-title"
          eyebrow="Universo de produtos"
          title={
            <>
              Cinco linhas. <em>Piso, parede e teto.</em>
            </>
          }
          intro="Cada linha tem seu próprio catálogo, com padrões, medidas, cálculo e cuidados. Comece pela superfície que você quer transformar."
        />
      </div>

      <div className="no-scrollbar mt-12 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 md:scroll-px-10 md:px-10 lg:mt-24 lg:block lg:space-y-32 lg:overflow-visible lg:px-0">
        {families.map((f, i) => {
          const flip = i % 2 === 1;
          return (
            <article id={`produto-${f.id}`} key={f.id} aria-labelledby={`fam-${f.id}`} className="w-[86%] shrink-0 snap-start scroll-mt-24 sm:w-[60%] md:w-[48%] lg:w-auto">
              <div className="grid items-center gap-6 lg:grid-cols-12 lg:gap-0">
                <Reveal
                  variant="image"
                  className={`group relative aspect-[4/3] overflow-hidden lg:col-span-7 lg:aspect-[16/11] ${
                    flip ? "lg:order-2 lg:col-start-6 lg:row-start-1" : ""
                  }`}
                >
                  <Image
                    src={f.image}
                    alt={f.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-arch)] group-hover:scale-[1.04]"
                  />
                  <span className="absolute left-0 top-0 bg-paper px-4 py-2 text-[0.65rem] uppercase tracking-[0.22em] text-ink">
                    {f.surface}
                  </span>
                </Reveal>

                <div
                  className={`lg:col-span-5 ${
                    flip ? "lg:order-1 lg:col-start-1 lg:row-start-1 lg:pl-16 lg:pr-12 xl:pl-24" : "lg:pl-14 lg:pr-16 xl:pr-24"
                  }`}
                >
                  <Reveal>
                    <p className="eyebrow text-copper-deep">
                      {f.kicker}
                    </p>
                    <h3 id={`fam-${f.id}`} className="display mt-4 text-[2rem] sm:text-4xl lg:mt-5 lg:text-5xl">
                      {f.name}
                    </h3>
                    <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink-soft lg:mt-6 lg:text-base">{f.summary}</p>
                    <ul className="mt-6 hidden flex-wrap gap-2 sm:flex" aria-label="Linhas e coleções">
                      {f.highlights.map((h) => (
                        <li key={h} className="border border-ink/20 px-3 py-1.5 text-xs text-ink-soft">
                          {h}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 lg:mt-8">
                      <a href={`#colecoes-${f.id}`} className="group/link inline-flex items-center gap-3 text-sm font-medium">
                        <span className="link-line pb-0.5">Explorar coleção</span>
                        <ArrowRight className="h-4 w-4 text-copper transition-transform duration-300 group-hover/link:translate-x-1" aria-hidden="true" />
                      </a>
                      <a href={`#catalogo-${f.catalogId}`} className="link-line pb-0.5 text-sm text-ink-soft">
                        Ver catálogo
                      </a>
                    </div>
                  </Reveal>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <p className="container-x mt-6 text-sm text-stone lg:hidden" aria-hidden="true">
        Deslize para ver as 5 linhas →
      </p>
    </section>
  );
}
