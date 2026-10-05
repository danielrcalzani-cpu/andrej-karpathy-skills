"use client";

import { useState } from "react";
import Image from "next/image";
import SectionHeading from "./SectionHeading";
import { products } from "@/data/products";

// Ambientes com imagens dos catálogos; "match" usa o campo "Ideal para" de cada padrão.
const rooms = [
  {
    name: "Sala de estar",
    match: ["Sala", "Sala de estar"],
    image: "/projects/piso-toscana-sala.jpg",
    alt: "Sala de estar clara com piso vinílico colado Toscana",
    credit: "Piso vinílico colado Toscana · Linha Sole",
  },
  {
    name: "Quarto",
    match: ["Quarto"],
    image: "/projects/piso-platinum-rei-quarto.jpg",
    alt: "Quarto com piso vinílico colado Platinum Rei em cinza médio",
    credit: "Piso vinílico colado Platinum Rei · Linha Realeza",
  },
  {
    name: "Sala de jantar",
    match: ["Sala de jantar"],
    image: "/projects/piso-barao-jacaranda-jantar.jpg",
    alt: "Sala de jantar com piso vinílico colado Barão Jacarandá em mel dourado",
    credit: "Piso vinílico colado Barão Jacarandá · Linha Realeza",
  },
  {
    name: "Cozinha",
    match: ["Cozinha"],
    image: "/projects/spc-madeiras-brasileiras-jantar.jpg",
    alt: "Cozinha integrada à sala de jantar com piso vinílico SPC em madeira mel",
    credit: "Piso vinílico SPC · Linha Madeiras Brasileiras",
  },
  {
    name: "Banheiro",
    match: ["Banheiro"],
    image: "/projects/teto-01-banheiro.jpg",
    alt: "Banheiro amplo com teto laminado em bege acinzentado claro",
    credit: "Teto laminado · Padrão 01",
  },
  {
    name: "Escritório",
    match: ["Escritório", "Home office"],
    image: "/projects/piso-contenssa-escritorio.jpg",
    alt: "Escritório com piso vinílico colado Contenssa em castanho acinzentado",
    credit: "Piso vinílico colado Contenssa · Linha Nobiltà",
  },
  {
    name: "Lojas e recepções",
    match: ["Comercial", "Espaço comercial", "Recepção"],
    image: "/projects/chateau-troussay-loja.jpg",
    alt: "Loja com balcão e parede de destaque em Château Mur Troussay, efeito mármore",
    credit: "Château Mur Troussay, cód. 247",
  },
  {
    name: "Restaurantes",
    match: ["Espaço comercial", "Área gourmet"],
    image: "/projects/teto-03-restaurante.jpg",
    alt: "Restaurante com teto laminado em castanho rústico",
    credit: "Teto laminado · Padrão 03",
  },
];

function suggestions(match: string[]) {
  return products.filter((p) => p.idealFor.some((a) => match.includes(a)));
}

export default function ApplicationGallery() {
  const [active, setActive] = useState(0);
  const room = rooms[active];
  const list = suggestions(room.match);

  return (
    <section id="ambientes" aria-labelledby="ambientes-title" className="bg-sand py-24 md:py-36">
      <div className="container-x">
        <SectionHeading
          id="ambientes-title"
          eyebrow="Ambientes"
          title={
            <>
              Uma nova superfície. <em>Um novo ambiente.</em>
            </>
          }
          intro="Os catálogos indicam, padrão a padrão, onde cada superfície se destaca. Escolha o ambiente e veja o que combina com ele."
        />

        {/* Desktop: lista + imagem */}
        <div className="mt-16 hidden gap-12 lg:grid lg:grid-cols-12">
          <ul className="lg:col-span-4" aria-label="Ambientes">
            {rooms.map((r, i) => (
              <li key={r.name} className="border-t border-ink/15 last:border-b">
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-pressed={i === active}
                  className={`group flex w-full items-baseline gap-5 py-4 text-left transition-colors ${
                    i === active ? "text-ink" : "text-stone hover:text-ink"
                  }`}
                >
                  <span className="font-serif text-[1.9rem] leading-tight">{r.name}</span>
                  <span
                    aria-hidden="true"
                    className={`ml-auto h-px self-center bg-copper transition-all duration-500 ${i === active ? "w-10" : "w-0"}`}
                  />
                </button>
              </li>
            ))}
          </ul>

          <div className="lg:col-span-8" aria-live="polite">
            <div className="relative aspect-[16/10] overflow-hidden bg-linen">
              {rooms.map((r, i) => (
                <Image
                  key={r.image}
                  src={r.image}
                  alt={i === active ? r.alt : ""}
                  fill
                  sizes="60vw"
                  className={`object-cover transition-[opacity,transform] duration-[900ms] ease-[var(--ease-arch)] ${
                    i === active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"
                  }`}
                />
              ))}
            </div>
            <div className="mt-5 grid grid-cols-12 gap-6">
              <p className="col-span-5 text-xs uppercase tracking-[0.16em] text-stone">
                {room.credit}
                <span className="mt-1 block normal-case tracking-normal">Imagem ilustrativa</span>
              </p>
              <div className="col-span-7">
                <p className="eyebrow text-copper-deep">
                  {list.length} padrões indicados para {room.name.toLowerCase()}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {list
                    .slice(0, 12)
                    .map((p) => p.name)
                    .join(" · ")}
                  {list.length > 12 && ` e mais ${list.length - 12}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/tablet: cartões deslizáveis */}
      <ul className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:px-10 lg:hidden" aria-label="Ambientes">
        {rooms.map((r) => {
          const l = suggestions(r.match);
          return (
            <li key={r.name} className="w-[82%] shrink-0 snap-start sm:w-[55%]">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image src={r.image} alt={r.alt} fill sizes="(min-width: 640px) 55vw, 82vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-paper">
                  <h3 className="font-serif text-3xl">{r.name}</h3>
                  <p className="mt-2 text-xs text-paper/75">{r.credit}</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                <span className="font-medium text-copper-deep">{l.length} padrões indicados: </span>
                {l
                  .slice(0, 6)
                  .map((p) => p.name)
                  .join(" · ")}
                {l.length > 6 && "…"}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
