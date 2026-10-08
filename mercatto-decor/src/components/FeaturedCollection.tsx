import Image from "next/image";
import { ArrowUpRight, Check, X } from "lucide-react";
import Reveal from "./Reveal";
import { WhatsAppIcon } from "./Icons";
import { familyById } from "@/data/collections";
import { catalogs } from "@/data/catalogs";
import { productLabel, products, type Product } from "@/data/products";
import { showcase } from "@/data/showcase";
import { productMessage, whatsappUrl } from "@/lib/whatsapp";

// "Em destaque": escolha a linha e depois o padrão. Funciona só com CSS (rádios + :has),
// inclusive em visualizadores sem JavaScript; as regras de exibição são geradas abaixo.

const lines = showcase.map((s) => {
  const family = familyById[s.id];
  const list = products.filter((p) => p.family === s.id);
  return {
    ...s,
    family,
    list,
    initial: (list.find((p) => p.image) ?? list[0]).id,
    catalog: catalogs.find((c) => c.id === family.catalogId)!,
  };
});

const rules = [
  ".fx-line,.fx-pv{display:none}",
  ...lines.map((l) => `#destaque:has(#fx-l-${l.id}:checked) .fx-line[data-l="${l.id}"]{display:block}`),
  ...products.map((p) => `#destaque:has(#fx-p-${p.id}:checked) .fx-pv[data-p="${p.id}"]{display:block}`),
].join("\n");

/** Desenho em escala: placa de 2,80 m ao lado de uma pessoa de 1,70 m (como no guia). */
function ScaleDrawing() {
  return (
    <svg viewBox="0 0 200 320" className="h-44 w-auto shrink-0 md:h-52" role="img" aria-labelledby="escala-titulo">
      <title id="escala-titulo">Placa Château Mur de 2,80 m de altura ao lado de uma pessoa de 1,70 m</title>
      <line x1="0" y1="300" x2="200" y2="300" stroke="currentColor" strokeOpacity="0.35" />
      <rect x="22" y="20" width="92" height="280" fill="url(#marble)" stroke="#e3b98f" strokeWidth="1" />
      <defs>
        <pattern id="marble" width="92" height="280" patternUnits="userSpaceOnUse">
          <rect width="92" height="280" fill="#efe8de" />
          <path d="M0 60 C30 80 40 40 92 70 M10 180 C40 150 60 210 92 160 M0 240 C25 230 55 270 92 250" stroke="#b9a58c" strokeWidth="1.2" fill="none" />
        </pattern>
      </defs>
      <g fill="currentColor" fillOpacity="0.55">
        <circle cx="158" cy="142" r="11" />
        <rect x="146" y="156" width="24" height="70" rx="10" />
        <rect x="148" y="220" width="9" height="80" rx="4" />
        <rect x="159" y="220" width="9" height="80" rx="4" />
      </g>
      <g stroke="#e3b98f" strokeWidth="0.8">
        <line x1="10" y1="20" x2="10" y2="300" />
        <line x1="6" y1="20" x2="14" y2="20" />
        <line x1="6" y1="300" x2="14" y2="300" />
        <line x1="190" y1="130" x2="190" y2="300" />
        <line x1="186" y1="130" x2="194" y2="130" />
      </g>
      <text x="68" y="14" textAnchor="middle" fontSize="10" fill="#e3b98f">0,92 m</text>
      <text x="4" y="165" fontSize="10" fill="#e3b98f" transform="rotate(-90 4 165)" textAnchor="middle">2,80 m</text>
      <text x="196" y="220" fontSize="10" fill="currentColor" fillOpacity="0.7" transform="rotate(90 196 220)" textAnchor="middle">1,70 m</text>
    </svg>
  );
}

/** Imagem grande do padrão escolhido: o ambiente do catálogo, ou a própria amostra. */
function PatternMedia({ p }: { p: Product }) {
  return (
    <div className="fx-pv absolute inset-0" data-p={p.id}>
      <Image
        src={p.image?.src ?? p.texture}
        alt={p.image ? `${p.name} aplicado: ${p.image.label.toLowerCase()}` : `Amostra do padrão ${p.name}: ${p.tone.toLowerCase()}`}
        fill
        sizes="(min-width: 1024px) 58vw, 100vw"
        className="object-cover"
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-night/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 md:p-8">
        {p.image && (
          <span className="relative block h-16 w-16 shrink-0 overflow-hidden ring-1 ring-paper/40 md:h-20 md:w-20">
            <Image src={p.texture} alt="" fill sizes="80px" className="object-cover" />
          </span>
        )}
        <span className="min-w-0">
          <span className="block font-serif text-2xl leading-tight md:text-4xl">{p.name}</span>
          <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.18em] text-paper/75">
            {p.image ? `${p.image.label} · imagem ilustrativa` : "Amostra do catálogo"}
          </span>
        </span>
      </div>
    </div>
  );
}

/** Ficha do padrão escolhido. */
function PatternDetail({ p, catalogFile }: { p: Product; catalogFile: string }) {
  const specs = [
    ["Medidas", p.dimensions],
    ["Área", p.area],
    ["Espessura", p.thickness],
    ["Capa de uso", p.wearLayer],
    ["Instalação", p.installation],
    ["Embalagem", p.packaging],
    ["Acabamento", p.finish],
  ].filter((s): s is [string, string] => Boolean(s[1]));
  return (
    <div className="fx-pv" data-p={p.id}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-[0.18em] text-copper-soft">
        {p.code && <span className="bg-paper px-2 py-1 text-ink">Cód. {p.code}</span>}
        {p.family !== "teto" && <span>{p.collection}</span>}
        <span className="text-paper/60">
          {p.effectLabel} · {p.tone}
        </span>
      </div>
      <h4 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">{p.name}</h4>
      <p className="mt-3 leading-relaxed text-paper/80">{p.description}</p>

      <p className="mt-6 text-[0.65rem] uppercase tracking-[0.18em] text-paper/55">Ideal para</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {p.idealFor.map((a) => (
          <li key={a} className="border border-paper/25 px-3 py-1 text-xs text-paper/85">
            {a}
          </li>
        ))}
      </ul>

      {specs.length > 0 && (
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3">
          {specs.map(([k, v]) => (
            <div key={k} className="border-t border-white/15 pt-2">
              <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-paper/55">{k}</dt>
              <dd className="mt-0.5 text-sm text-paper/90">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a href={whatsappUrl(productMessage(productLabel(p)))} target="_blank" rel="noopener noreferrer" className="btn btn-copper">
          <WhatsAppIcon className="h-4 w-4" />
          Quero este padrão
        </a>
        <a href={catalogFile} target="_blank" rel="noopener" className="btn btn-ghost-light">
          Ver no catálogo
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export default function FeaturedCollection() {
  return (
    <section id="destaque" aria-labelledby="destaque-title" className="bg-night py-16 text-paper md:py-28">
      <style>{rules}</style>

      <div className="container-x">
        <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow text-copper-soft">Em destaque</p>
            <h2 id="destaque-title" className="display mt-5 text-[2.6rem] leading-[1.05] md:text-6xl">
              Cada linha, <em className="text-copper-soft">em detalhe.</em>
            </h2>
          </div>
          <p className="max-w-md leading-relaxed text-paper/70 lg:col-span-5">
            Escolha uma linha e depois um padrão: veja a descrição completa, as medidas e os ambientes em que ele se destaca.
            Informações dos nossos catálogos.
          </p>
        </Reveal>

        {/* Linhas */}
        <div role="radiogroup" aria-label="Linha de produto" className="no-scrollbar relative -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 md:mx-0 md:mt-14 md:px-0">
          {lines.map((l, i) => (
            <div key={l.id} className="relative shrink-0 md:flex-1">
              <input type="radio" name="fx-line" id={`fx-l-${l.id}`} defaultChecked={i === 0} className="peer sr-only" />
              <label
                htmlFor={`fx-l-${l.id}`}
                className="block cursor-pointer border border-white/15 px-4 py-3 transition-colors hover:border-white/40 peer-checked:border-copper-soft peer-checked:bg-paper peer-checked:text-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-copper-soft md:px-5 md:py-4"
              >
                <span className="block text-[0.6rem] uppercase tracking-[0.2em] opacity-60">{l.family.surface}</span>
                <span className="mt-1 block whitespace-nowrap font-serif text-lg leading-tight md:text-xl">{l.family.name}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Painéis */}
      {lines.map((l) => (
        <div key={l.id} className="fx-line mt-8 md:mt-12" data-l={l.id}>
          <div className="container-x grid gap-8 lg:grid-cols-12 lg:gap-0">
            {/* imagem do padrão escolhido (fixa no desktop enquanto o texto rola) */}
            <div className="order-3 lg:order-none lg:col-span-7 lg:row-span-4">
              <div className="relative aspect-[4/5] overflow-hidden bg-ink sm:aspect-[4/3] lg:sticky lg:top-24 lg:aspect-[4/5] xl:aspect-[5/6]">
                {l.list.map((p) => (
                  <PatternMedia key={p.id} p={p} />
                ))}
              </div>
            </div>

            {/* apresentação da linha */}
            <div className="order-1 lg:order-none lg:col-span-5 lg:pl-14 xl:pl-20">
              <p className="eyebrow text-copper-soft">{l.family.kicker}</p>
              <h3 className="display mt-4 text-4xl md:text-5xl">
                {l.title[0]} <em className="text-copper-soft">{l.title[1]}</em>
              </h3>
              <p className="mt-5 font-serif text-xl italic text-paper/90">{l.lead}</p>
              <p className="mt-4 leading-relaxed text-paper/75">{l.story}</p>

              <div className="mt-8 flex items-end gap-6">
                {l.id === "chateau" && <ScaleDrawing />}
                <dl className={`grid flex-1 gap-x-6 gap-y-4 ${l.id === "chateau" ? "grid-cols-1" : "grid-cols-2"}`}>
                  {l.numbers.map((n) => (
                    <div key={n.label} className="border-t border-white/15 pt-2">
                      <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-paper/55">{n.label}</dt>
                      <dd className="font-serif text-xl leading-snug">{n.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* escolha do padrão */}
            <div className="order-2 lg:order-none lg:col-span-5 lg:col-start-8 lg:pl-14 lg:pt-12 xl:pl-20">
              <p className="eyebrow text-paper/60">
                Escolha o padrão · {l.list.length}
              </p>
              <ul className="mt-4 grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-7 lg:grid-cols-5" role="radiogroup" aria-label={`Padrões de ${l.family.name}`}>
                {l.list.map((p) => (
                  <li key={p.id} className="relative">
                    <input type="radio" name={`fx-p-${l.id}`} id={`fx-p-${p.id}`} defaultChecked={p.id === l.initial} className="peer sr-only" />
                    <label htmlFor={`fx-p-${p.id}`} className="group block cursor-pointer text-paper/60 peer-checked:text-paper">
                      <span className="relative block aspect-square overflow-hidden ring-1 ring-white/15 transition-shadow group-hover:ring-white/50">
                        <Image src={p.texture} alt="" fill sizes="96px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      </span>
                      <span className="mt-1.5 block text-[0.68rem] leading-tight">{p.name}</span>
                    </label>
                    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 hidden aspect-square ring-2 ring-copper-soft ring-offset-2 ring-offset-night peer-checked:block peer-focus-visible:block" />
                  </li>
                ))}
              </ul>
            </div>

            {/* ficha do padrão */}
            <div className="order-4 lg:order-none lg:col-span-5 lg:col-start-8 lg:pl-14 lg:pt-10 xl:pl-20" aria-live="polite">
              {l.list.map((p) => (
                <PatternDetail key={p.id} p={p} catalogFile={l.catalog.file} />
              ))}
            </div>
          </div>

          {/* diferenciais da linha */}
          <div className="container-x mt-14 md:mt-20">
            <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {l.points.map((pt) => (
                <div key={pt.title} className="bg-night py-5 pr-6 sm:p-6 lg:p-7">
                  <p className="flex items-center gap-2 font-serif text-xl">
                    <span aria-hidden="true" className="h-px w-5 bg-copper-soft" />
                    {pt.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-paper/70">{pt.text}</p>
                </div>
              ))}
            </div>
            {l.use && (
              <div className="mt-6 grid gap-4 text-sm leading-relaxed md:grid-cols-2">
                <p className="flex gap-3 text-paper/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-copper-soft" aria-hidden="true" />
                  <span>
                    <span className="font-medium text-paper">Onde usar: </span>
                    {l.use.yes}
                  </span>
                </p>
                <p className="flex gap-3 text-paper/80">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-paper/50" aria-hidden="true" />
                  <span>
                    <span className="font-medium text-paper">Onde evitar: </span>
                    {l.use.no}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      ))}

      <p className="container-x mt-10 text-xs text-paper/45">
        Imagens ilustrativas; as cores na tela são aproximadas. Peça a amostra física na loja antes da escolha final.
      </p>
    </section>
  );
}
