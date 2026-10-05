import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Reveal from "./Reveal";
import { WhatsAppIcon } from "./Icons";
import { products } from "@/data/products";
import { catalogs } from "@/data/catalogs";
import { productMessage, whatsappUrl } from "@/lib/whatsapp";

const patterns = products.filter((p) => p.collection === "Coleção Château Mur");
const guide = catalogs.find((c) => c.id === "chateau-mur")!;

const specs = [
  { value: "2,80 × 0,92 m", label: "Formato da placa" },
  { value: "2,58 m²", label: "Por placa" },
  { value: "2 mm", label: "De espessura" },
  { value: "5,16 m²", label: "Por caixa · 02 placas" },
];

/** Desenho em escala: placa de 2,80 m ao lado de uma pessoa de 1,70 m (como no guia). */
function ScaleDrawing() {
  return (
    <svg viewBox="0 0 200 320" className="h-56 w-auto md:h-64" role="img" aria-labelledby="escala-titulo">
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

export default function FeaturedCollection() {
  return (
    <section id="chateau-mur" aria-labelledby="chateau-title" className="bg-night text-paper">
      <div className="grid lg:grid-cols-12">
        <Reveal variant="image" className="relative min-h-[60vh] overflow-hidden lg:col-span-7 lg:min-h-[100svh]">
          <Image
            src="/projects/chateau-quarto.jpg"
            alt="Quarto com parede inteira revestida em placas Château Mur efeito madeira, do rodapé ao teto"
            fill
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover"
          />
          <span className="absolute bottom-0 left-0 bg-night/80 px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-paper/80">
            Château Mur · imagem ilustrativa
          </span>
        </Reveal>

        <div className="flex flex-col justify-center px-5 py-16 md:px-10 lg:col-span-5 lg:px-14 lg:py-24 xl:px-20">
          <Reveal>
            <p className="eyebrow flex items-center gap-3 text-copper-soft">
              <span className="font-serif text-sm tracking-normal">06</span>
              <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />
              Em destaque
            </p>
            <h2 id="chateau-title" className="display mt-5 text-5xl md:text-6xl xl:text-7xl">
              Château <em className="text-copper-soft">Mur.</em>
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-paper/80">
              Revestimento vinílico de parede em grande formato. Uma única placa vai do rodapé ao teto em paredes de pé-direito
              comum — sem emenda horizontal, sem rejunte, colada sobre a parede existente.
            </p>
          </Reveal>

          <Reveal delay={120} className="mt-10 flex items-end gap-8">
            <ScaleDrawing />
            <dl className="grid flex-1 grid-cols-1 gap-y-4">
              {specs.map((s) => (
                <div key={s.label} className="border-t border-white/15 pt-2">
                  <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-paper/60">{s.label}</dt>
                  <dd className="font-serif text-xl">{s.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={200} className="mt-10">
            <p className="eyebrow text-paper/60">Coleção Château Mur · {patterns.length} padrões</p>
            <ul className="mt-4 grid grid-cols-5 gap-2">
              {patterns.map((p) => (
                <li key={p.id}>
                  <a
                    href={whatsappUrl(productMessage(`Château Mur ${p.name} (cód. ${p.code})`))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                    aria-label={`Solicitar orçamento do Château Mur ${p.name}, código ${p.code}`}
                  >
                    <span className="relative block aspect-[1/2] overflow-hidden ring-1 ring-white/10">
                      <Image src={p.texture} alt="" fill sizes="10vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    </span>
                    <span className="mt-2 block text-[0.7rem] leading-tight text-paper/85">{p.name}</span>
                    <span className="block text-[0.65rem] text-paper/50">{p.code}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-paper/55">Também no guia: pedras Coronato e madeiras em alto brilho.</p>
          </Reveal>

          <Reveal delay={260} className="mt-10 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <a
              href={whatsappUrl(productMessage("Château Mur"))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-copper"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Solicitar orçamento
            </a>
            <a href={guide.file} target="_blank" rel="noopener" className="btn btn-ghost-light">
              Guia de especificação
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
