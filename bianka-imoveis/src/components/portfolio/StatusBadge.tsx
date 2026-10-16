import type { PortfolioItem } from "@/content/portfolio";

/** "Vendido" para itens reais; "Demonstração" para exemplos de layout. */
export function StatusBadge({ item, className = "" }: { item: PortfolioItem; className?: string }) {
  return item.isDemo ? (
    <span
      className={`inline-flex items-center border border-dashed border-aubergine/60 bg-ivory px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.2em] text-aubergine ${className}`}
    >
      Demonstração
    </span>
  ) : (
    <span
      className={`inline-flex items-center bg-aubergine px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.2em] text-gold-light ${className}`}
    >
      Vendido
    </span>
  );
}
