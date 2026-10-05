"use client";

import { useState } from "react";
import Image from "next/image";
import SectionHeading from "./SectionHeading";
import { products, type Effect } from "@/data/products";

type Material = {
  effects: Effect[];
  name: string;
  text: string;
  texture: string;
  credit: string;
  /** Amostras pequenas são repetidas em escala real em vez de ampliadas. */
  tile?: number;
};

const materials: Material[] = [
  {
    effects: ["madeira"],
    name: "Madeira",
    text: "Veios em catedral, nós e raios do carvalho. Do palha claro ao castanho profundo, no chão, na parede e no teto.",
    texture: "/textures/spc/freijo.jpg",
    credit: "Piso SPC Freijó",
  },
  {
    effects: ["marmore"],
    name: "Mármore",
    text: "Fundos luminosos ou profundos, com veios cinza, taupe e dourados reproduzidos em alta resolução.",
    texture: "/textures/chateau/coronato-bianco-carrara.jpg",
    credit: "Coronato Bianco Carrara",
  },
  {
    effects: ["pedra"],
    name: "Pedra",
    text: "O visual da pedra calcária e das pedras bege acinzentadas: neutros quentes que servem de fundo para tudo.",
    texture: "/textures/placas/295-placa-vinilica-caliza.jpg",
    credit: "Placa Vinílica Caliza, cód. 295",
    tile: 248,
  },
  {
    effects: ["linho"],
    name: "Linho",
    text: "A trama do tecido na parede. Uma superfície que aquece o ambiente e pede para ser tocada.",
    texture: "/textures/placas/171-linho-cinza-escuro.jpg",
    credit: "Linho Cinza Escuro, cód. 171",
    tile: 327,
  },
  {
    effects: ["espelho", "liso"],
    name: "Brilho & liso",
    text: "Do cinza mate ao preto espelhado dos pianos de cauda: superfícies que refletem a luz e ampliam o espaço.",
    texture: "/textures/placas/167-black-piano.jpg",
    credit: "Black Piano, cód. 167",
  },
  {
    effects: ["pastilha"],
    name: "Pastilha",
    text: "O mosaico em prata e cinza, com o charme do revestimento cerâmico — sem rejunte e sem obra.",
    texture: "/textures/placas/174-pastilha-cinza.jpg",
    credit: "Pastilha Cinza, cód. 174",
    tile: 330,
  },
];

export default function TextureGallery() {
  const [active, setActive] = useState(0);

  return (
    <section id="materiais" aria-labelledby="materiais-title" className="bg-night py-24 text-paper md:py-36">
      <div className="container-x">
        <SectionHeading
          id="materiais-title"
          eyebrow="Matéria"
          tone="dark"
          title={
            <>
              Sinta a <em className="text-copper-soft">textura</em> antes de ver o ambiente.
            </>
          }
          intro="Amostras reais dos catálogos, em detalhe. Escolha um efeito para ver em quais padrões ele aparece — e peça a amostra física na loja antes da escolha final."
        />

        <div className="mt-14 flex flex-col gap-2 md:mt-20 md:h-[34rem] md:flex-row">
          {materials.map((m, i) => {
            const open = i === active;
            const list = products.filter((p) => m.effects.includes(p.effect));
            return (
              <div
                key={m.name}
                onMouseEnter={() => setActive(i)}
                className={`relative overflow-hidden transition-[flex-grow,height] duration-700 ease-[var(--ease-arch)] ${
                  open ? "h-[30rem] md:h-auto md:flex-[5]" : "h-20 md:h-auto md:flex-[1]"
                }`}
              >
                {m.tile ? (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ backgroundImage: `url(${m.texture})`, backgroundSize: `${m.tile}px`, backgroundRepeat: "repeat" }}
                  />
                ) : (
                  <Image src={m.texture} alt="" fill sizes="(min-width: 768px) 60vw, 100vw" className="object-cover" />
                )}
                <div
                  className={`absolute inset-0 transition-colors duration-700 ${
                    open ? "bg-gradient-to-t from-night/90 via-night/30 to-transparent" : "bg-night/55"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  aria-expanded={open}
                  aria-controls={`material-${i}`}
                  className="absolute inset-0 z-10 flex items-start p-5 text-left md:p-6"
                >
                  <span className="flex items-baseline gap-3 md:[writing-mode:vertical-rl] md:rotate-180 md:data-[open=true]:[writing-mode:horizontal-tb] md:data-[open=true]:rotate-0" data-open={open}>
                    <span className="font-serif text-2xl md:text-3xl">{m.name}</span>
                  </span>
                </button>

                <div
                  id={`material-${i}`}
                  className={`absolute inset-x-0 bottom-0 z-20 p-5 transition-all duration-700 md:p-8 ${
                    open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
                  }`}
                  aria-hidden={!open}
                >
                  <p className="max-w-md text-sm leading-relaxed text-paper/85 md:text-base">{m.text}</p>
                  <p className="eyebrow mt-5 text-copper-soft">
                    {list.length} {list.length === 1 ? "padrão" : "padrões"}
                  </p>
                  <p className="mt-2 max-w-lg text-sm text-paper/75">
                    {list
                      .slice(0, 9)
                      .map((p) => p.name)
                      .join(" · ")}
                    {list.length > 9 && ` e mais ${list.length - 9}`}
                  </p>
                  <p className="mt-4 text-[0.7rem] text-paper/50">Na imagem: {m.credit}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
