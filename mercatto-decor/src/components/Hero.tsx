import Image from "next/image";
import { ArrowDown, ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "./Icons";
import { whatsappUrl } from "@/lib/whatsapp";

const surfaces = [
  { label: "Piso", href: "#produto-piso-colado" },
  { label: "Parede", href: "#produto-placas" },
  { label: "Teto", href: "#produto-teto" },
];

export default function Hero() {
  return (
    <section id="topo" aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-night text-white">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/projects/teto-recepcao.jpg"
          alt="Recepção ampla com teto laminado em madeira, iluminação indireta e piso claro"
          fill
          priority
          sizes="100vw"
          className="hero-zoom object-cover object-[50%_40%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(31,27,24,0.55)_0%,rgba(31,27,24,0.15)_35%,rgba(31,27,24,0.35)_60%,rgba(31,27,24,0.88)_100%)]" />
      </div>

      <div className="container-x flex flex-1 flex-col justify-end pb-10 pt-32 md:pb-14">
        <p className="eyebrow rise text-copper-soft" style={{ "--rise-delay": "150ms" } as React.CSSProperties}>
          Pisos · Paredes · Tetos — Manaus
        </p>
        <h1
          id="hero-title"
          className="display rise mt-5 max-w-5xl text-[2.9rem] sm:text-6xl lg:text-[5.4rem] xl:text-[6.2rem]"
          style={{ "--rise-delay": "300ms" } as React.CSSProperties}
        >
          Superfícies que <em className="text-copper-soft">redesenham</em> o ambiente.
        </h1>
        <div className="rise mt-8 grid gap-8 md:grid-cols-12 md:items-end" style={{ "--rise-delay": "500ms" } as React.CSSProperties}>
          <p className="max-w-xl text-base leading-relaxed text-white/85 md:col-span-6 md:text-lg">
            Pisos vinílicos, placas de revestimento flexível, Château Mur e teto laminado. Madeira, mármore, pedra e linho para
            transformar piso, parede e teto com instalação prática.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row md:col-span-6 md:justify-end">
            <a href="#produtos" className="btn btn-copper">
              Conhecer produtos
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-light">
              <WhatsAppIcon className="h-4 w-4" />
              Solicitar orçamento
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="container-x flex items-center justify-between gap-6 py-4 text-[0.7rem] uppercase tracking-[0.2em] text-white/70">
          <nav aria-label="Superfícies" className="flex gap-6 sm:gap-10">
            {surfaces.map((s) => (
              <a key={s.label} href={s.href} className="link-line hover:text-white">
                {s.label}
              </a>
            ))}
          </nav>
          <span className="hidden md:inline">Teto laminado · imagem ilustrativa</span>
          <a href="#numeros" aria-label="Rolar para o conteúdo" className="inline-flex items-center gap-2 hover:text-white">
            <span className="hidden sm:inline">Role</span>
            <ArrowDown className="h-4 w-4 motion-safe:animate-bounce" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
