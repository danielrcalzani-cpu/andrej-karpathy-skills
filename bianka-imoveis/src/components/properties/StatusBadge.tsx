import { statusLabel, type Property } from "@/content/properties";

const base = "inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em]";
/** Versão menor para os cartões no celular; volta ao tamanho normal a partir de 768px. */
const compactBase =
  "inline-flex items-center px-1.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.06em] md:px-2.5 md:py-1 md:text-xs md:tracking-[0.16em]";

const styles = {
  venda: "bg-aubergine text-gold-light ring-1 ring-inset ring-gold-light/45",
  aluguel: "bg-gold-light text-aubergine-deep",
  vendido: "bg-charcoal/85 text-ivory",
} as const;

/** "À venda", "Para alugar" ou "Vendido" — cores diferentes para cada situação. */
export function StatusBadge({ item, compact = false }: { item: Property; compact?: boolean }) {
  return <span className={`${compact ? compactBase : base} ${styles[item.status]}`}>{statusLabel[item.status]}</span>;
}

/** Marca visível de item de demonstração. */
export function DemoBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`${compact ? compactBase : base} border border-dashed border-aubergine/60 bg-ivory text-aubergine`}>
      {compact ? (
        <>
          <span className="md:hidden">Demo</span>
          <span className="hidden md:inline">Demonstração</span>
        </>
      ) : (
        "Demonstração"
      )}
    </span>
  );
}

export function Badges({ item, compact = false, className = "" }: { item: Property; compact?: boolean; className?: string }) {
  return (
    <span className={`flex flex-wrap gap-1 md:gap-1.5 ${className}`}>
      <StatusBadge item={item} compact={compact} />
      {item.isDemo && <DemoBadge compact={compact} />}
    </span>
  );
}
