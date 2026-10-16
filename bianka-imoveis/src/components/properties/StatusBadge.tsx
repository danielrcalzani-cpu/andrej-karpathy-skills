import { statusLabel, type Property } from "@/content/properties";

const base = "inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em]";

const styles = {
  venda: "bg-aubergine text-gold-light ring-1 ring-inset ring-gold-light/45",
  aluguel: "bg-gold-light text-aubergine-deep",
  vendido: "bg-charcoal/85 text-ivory",
} as const;

/** "À venda", "Para alugar" ou "Vendido" — cores diferentes para cada situação. */
export function StatusBadge({ item }: { item: Property }) {
  return <span className={`${base} ${styles[item.status]}`}>{statusLabel[item.status]}</span>;
}

/** Marca visível de item de demonstração. */
export function DemoBadge() {
  return <span className={`${base} border border-dashed border-aubergine/60 bg-ivory text-aubergine`}>Demonstração</span>;
}

export function Badges({ item, className = "" }: { item: Property; className?: string }) {
  return (
    <span className={`flex flex-wrap gap-1.5 ${className}`}>
      <StatusBadge item={item} />
      {item.isDemo && <DemoBadge />}
    </span>
  );
}
