import Image from "next/image";
import { ArrowUpRight, Download } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { catalogs } from "@/data/catalogs";

export default function CatalogSection() {
  return (
    <section id="catalogos" aria-labelledby="catalogos-title" className="bg-linen/60 py-24 md:py-36">
      <div className="container-x">
        <SectionHeading
          id="catalogos-title"
          eyebrow="Catálogos 2026"
          title={
            <>
              Leve o showroom <em>com você.</em>
            </>
          }
          intro="Cada catálogo traz todos os padrões, escala real, paginação, cálculo e cuidados. Abra no navegador ou baixe o PDF para consultar na obra."
        />

        <ul className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {catalogs.map((c, i) => (
            <Reveal as="li" key={c.id} delay={i * 80} className="group flex flex-col">
              <article id={`catalogo-${c.id}`} aria-labelledby={`cat-${c.id}`} className="flex h-full scroll-mt-28 flex-col">
                <a
                  href={c.file}
                  target="_blank"
                  rel="noopener"
                  className="relative block aspect-[4/5] overflow-hidden bg-sand"
                  aria-label={`Abrir o catálogo ${c.title} (PDF)`}
                >
                  <Image
                    src={c.cover}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 18vw, (min-width: 640px) 45vw, 90vw"
                    className="object-contain p-6 drop-shadow-[0_18px_22px_rgba(43,39,36,0.28)] transition-transform duration-700 ease-[var(--ease-arch)] group-hover:-translate-y-1.5 group-hover:scale-[1.02]"
                  />
                </a>
                <p className="eyebrow mt-5 text-copper-deep">{c.subtitle}</p>
                <h3 id={`cat-${c.id}`} className="mt-2 font-serif text-2xl leading-tight">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.description}</p>
                <p className="mt-2 text-xs text-stone">
                  PDF · {c.pages} páginas · {c.size}
                </p>
                <div className="mt-auto flex gap-5 pt-5 text-[0.72rem] font-medium uppercase tracking-[0.16em]">
                  <a href={c.file} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 hover:text-copper-deep">
                    Ver catálogo <ArrowUpRight className="h-3.5 w-3.5 text-copper" aria-hidden="true" />
                  </a>
                  <a href={c.file} download className="inline-flex items-center gap-1.5 text-ink-soft hover:text-copper-deep">
                    Baixar <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">o catálogo {c.title}</span>
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
