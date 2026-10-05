import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/data/products";
import { productLabel } from "@/data/products";
import { productMessage, whatsappUrl } from "@/lib/whatsapp";

/** Cartão de padrão: textura real do catálogo; no hover mostra o ambiente (quando o catálogo traz um). */
export default function ProductCard({ product: p }: { product: Product }) {
  const specs = [p.dimensions, p.thickness, p.wearLayer && `capa ${p.wearLayer}`, p.finish].filter(Boolean) as string[];
  return (
    <article className="group flex h-full flex-col" aria-labelledby={`p-${p.id}`}>
      <div
        className="relative aspect-[4/5] overflow-hidden bg-linen"
        tabIndex={p.image ? 0 : undefined}
        aria-label={p.image ? `Ver o padrão ${p.name} aplicado: ${p.image.label}` : undefined}
      >
        <Image
          src={p.texture}
          alt={`Textura do padrão ${p.name}: ${p.tone.toLowerCase()}, efeito ${p.effectLabel.toLowerCase()}`}
          fill
          sizes="(min-width: 1280px) 22vw, (min-width: 768px) 32vw, 78vw"
          className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-arch)] group-hover:scale-105"
        />
        {p.image && (
          <Image
            src={p.image.src}
            alt=""
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 32vw, 78vw"
            className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-focus-within:opacity-100"
          />
        )}
        {p.code && (
          <span className="absolute left-0 top-0 bg-ink px-3 py-1.5 text-[0.65rem] tracking-[0.18em] text-paper">CÓD. {p.code}</span>
        )}
        {p.image && (
          <span className="absolute bottom-0 right-0 bg-paper/90 px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.18em] text-ink opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-focus-within:opacity-100">
            {p.image.label}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col pt-5">
        <p className="eyebrow text-copper-deep">{p.collection}</p>
        <h3 id={`p-${p.id}`} className="mt-2 font-serif text-[1.65rem] leading-tight">
          {p.name}
        </h3>
        <p className="mt-1 text-xs text-stone">
          {p.effectLabel} · {p.tone}
        </p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-soft">{p.description}</p>
        {specs.length > 0 && <p className="mt-3 text-xs text-ink-soft">{specs.join(" · ")}</p>}
        <a
          href={whatsappUrl(productMessage(productLabel(p)))}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-2 pt-5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink hover:text-copper-deep"
          aria-label={`Solicitar orçamento de ${productLabel(p)} pelo WhatsApp`}
        >
          Solicitar orçamento
          <ArrowUpRight className="h-4 w-4 text-copper" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
