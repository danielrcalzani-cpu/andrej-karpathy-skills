"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import SectionHeading from "./SectionHeading";
import { families, type FamilyId } from "@/data/collections";
import { productsByFamily } from "@/data/products";

const tabs: { id: FamilyId; label: string }[] = [
  { id: "placas", label: "Placas flexíveis" },
  { id: "chateau", label: "Château Mur" },
  { id: "piso-colado", label: "Piso colado" },
  { id: "piso-spc", label: "Piso SPC" },
  { id: "teto", label: "Teto laminado" },
];

export default function ProductDiscovery() {
  const [active, setActive] = useState<FamilyId>("placas");
  const trackRef = useRef<HTMLUListElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [edges, setEdges] = useState({ start: true, end: false });

  const items = productsByFamily(active);
  const family = families.find((f) => f.id === active)!;

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 });
    updateEdges();
  }, [active, updateEdges]);

  // Links "Explorar coleção" (#colecoes-<familia>) abrem a aba correspondente.
  useEffect(() => {
    const fromHash = () => {
      const m = window.location.hash.match(/^#colecoes-(.+)$/);
      if (m && tabs.some((t) => t.id === m[1])) {
        setActive(m[1] as FamilyId);
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section ref={sectionRef} id="colecoes" aria-labelledby="colecoes-title" className="scroll-mt-16 bg-paper py-16 md:py-36">
      <div className="container-x">
        <SectionHeading
          id="colecoes-title"
          eyebrow="Coleções e padrões"
          title={
            <>
              Escolha pelo <em>padrão.</em>
            </>
          }
          intro="Todos os padrões dos catálogos, com código, efeito e medidas. Toque ou passe o cursor sobre a amostra para ver o padrão aplicado, quando houver imagem de ambiente."
        />

        <div className="mt-14 flex flex-col gap-6 border-b border-ink/15 md:flex-row md:items-end md:justify-between">
          <div role="tablist" aria-label="Linhas de produto" className="no-scrollbar -mx-5 flex overflow-x-auto px-5 md:mx-0 md:px-0">
            {tabs.map((t, i) => {
              const selected = t.id === active;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  type="button"
                  id={`tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls="colecoes-painel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(t.id)}
                  onKeyDown={(e) => onTabKey(e, i)}
                  className={`relative shrink-0 px-4 pb-4 pt-2 text-sm whitespace-nowrap transition-colors first:pl-0 ${
                    selected ? "text-ink" : "text-stone hover:text-ink"
                  }`}
                >
                  {t.label}
                  <span className="ml-1.5 text-xs text-copper-deep">{productsByFamily(t.id).length}</span>
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-[-1px] h-[2px] bg-copper transition-transform duration-500 first:left-0 ${
                      selected ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <div className="hidden gap-2 pb-3 md:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={edges.start}
              aria-label="Padrões anteriores"
              aria-controls="colecoes-trilho"
              className="inline-flex h-11 w-11 items-center justify-center border border-ink/25 transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={edges.end}
              aria-label="Próximos padrões"
              aria-controls="colecoes-trilho"
              className="inline-flex h-11 w-11 items-center justify-center border border-ink/25 transition-colors hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div id="colecoes-painel" role="tabpanel" aria-labelledby={`tab-${active}`} className="pt-8">
          <p className="max-w-2xl text-sm text-ink-soft">
            <span className="font-medium text-ink">{family.name}.</span> {family.specs.map((s) => `${s.label}: ${s.value}`).join(" · ")}
          </p>
        </div>
      </div>

      <div className="relative mt-10">
        <ul
          ref={trackRef}
          id="colecoes-trilho"
          aria-label={`Padrões de ${family.name}`}
          onScroll={updateEdges}
          className="no-scrollbar flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto scroll-smooth px-5 pb-4 md:scroll-px-10 md:gap-8 md:px-10 xl:scroll-px-[max(4rem,calc((100vw_-_88rem)/2_+_4rem))] xl:px-[max(4rem,calc((100vw_-_88rem)/2_+_4rem))]"
        >
          {items.map((p, i) => (
            <li
              key={p.id}
              aria-label={`${i + 1} de ${items.length}`}
              className="w-[78%] shrink-0 snap-start sm:w-[46%] md:w-[31%] xl:w-[22%]"
            >
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </div>

      <div className="container-x mt-8 flex items-center justify-between text-sm">
        <p className="text-stone md:hidden">Deslize para ver mais →</p>
        <a href={`#catalogo-${family.catalogId}`} className="link-line ml-auto pb-0.5 font-medium">
          Ver catálogo completo de {family.name}
        </a>
      </div>
    </section>
  );
}
