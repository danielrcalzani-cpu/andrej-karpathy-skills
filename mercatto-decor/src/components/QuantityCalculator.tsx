"use client";

import { useId, useMemo, useState } from "react";
import { WhatsAppIcon } from "./Icons";
import { products } from "@/data/products";
import { whatsappUrl } from "@/lib/whatsapp";

// Regras de cálculo exatamente como nos catálogos Mercatto Decor (edição 2026).
type Mode = "chateau" | "placas" | "caliza" | "piso-colado" | "piso-spc" | "teto";

const MODES: Record<
  Mode,
  { label: string; product: string; input: "width" | "area"; note: string; patterns: string[] }
> = {
  chateau: {
    label: "Château Mur (parede)",
    product: "Château Mur",
    input: "width",
    note: "Largura ÷ 0,92 m. Válido para paredes com até 2,80 m de altura; com portas, janelas ou muitos recortes, considere uma placa extra. Cada caixa traz 02 placas.",
    patterns: products.filter((p) => p.collection === "Coleção Château Mur").map((p) => `${p.name} (cód. ${p.code})`),
  },
  placas: {
    label: "Placa flexível (parede)",
    product: "Placa de revestimento flexível",
    input: "width",
    note: "Largura ÷ 1,22 m, arredondando para cima. Válido para paredes com até 2,90 m de altura; com portas, janelas ou muitos recortes, considere uma placa extra.",
    patterns: products.filter((p) => p.family === "placas" && p.code !== "295").map((p) => `${p.name} (cód. ${p.code})`),
  },
  caliza: {
    label: "Placa Vinílica Caliza (parede)",
    product: "Placa Vinílica Caliza (cód. 295)",
    input: "width",
    note: "Largura ÷ 1,20 m, arredondando para cima. Válido para paredes com até 2,75 m de altura.",
    patterns: [],
  },
  "piso-colado": {
    label: "Piso vinílico colado",
    product: "Piso vinílico colado",
    input: "area",
    note: "Área × 1,10 (10% para recortes e perdas). A quantidade de m² por caixa é informada no orçamento.",
    patterns: products.filter((p) => p.family === "piso-colado").map((p) => `${p.name} (${p.collection})`),
  },
  "piso-spc": {
    label: "Piso vinílico SPC",
    product: "Piso vinílico SPC",
    input: "area",
    note: "Área × 1,10 ÷ 0,322 m² por régua. Em ambientes com muitos recortes, colunas ou diagonal, considere uma margem maior.",
    patterns: products.filter((p) => p.family === "piso-spc").map((p) => `${p.name} (${p.collection})`),
  },
  teto: {
    label: "Teto laminado",
    product: "Teto laminado",
    input: "area",
    note: "Comprimento × largura × 1,10. Em tetos com sancas, vigas ou paginação diagonal, considere uma margem maior.",
    patterns: products.filter((p) => p.family === "teto").map((p) => p.name),
  },
};

const fmt = (n: number, d = 2) => n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const parse = (v: string) => {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const ceil = (n: number) => Math.ceil(n - 1e-9);

function compute(mode: Mode, width: number, length: number) {
  switch (mode) {
    case "chateau": {
      const plates = ceil(width / 0.92);
      return { main: `${plates} placas`, detail: `${ceil(plates / 2)} caixas · ${fmt(plates * 2.58)} m²`, summary: `parede de ${fmt(width)} m de largura → ${plates} placas (${ceil(plates / 2)} caixas)` };
    }
    case "placas": {
      const plates = ceil(width / 1.22);
      return { main: `${plates} placas`, detail: `${fmt(plates * 3.54)} m² de revestimento`, summary: `parede de ${fmt(width)} m de largura → ${plates} placas` };
    }
    case "caliza": {
      const plates = ceil(width / 1.2);
      return { main: `${plates} placas`, detail: `${fmt(plates * 3.3)} m² de revestimento`, summary: `parede de ${fmt(width)} m de largura → ${plates} placas` };
    }
    case "piso-spc": {
      const area = width * length;
      const boards = ceil((area * 1.1) / 0.322);
      return { main: `${boards} réguas`, detail: `${fmt(area)} m² + 10% = ${fmt(area * 1.1)} m²`, summary: `ambiente de ${fmt(length)} × ${fmt(width)} m (${fmt(area)} m²) → ${boards} réguas` };
    }
    default: {
      const area = width * length;
      return { main: `${fmt(area * 1.1)} m²`, detail: `${fmt(area)} m² + 10% para recortes e perdas`, summary: `ambiente de ${fmt(length)} × ${fmt(width)} m (${fmt(area)} m²) → ${fmt(area * 1.1)} m² a comprar` };
    }
  }
}

export default function QuantityCalculator() {
  const uid = useId();
  const [mode, setMode] = useState<Mode>("chateau");
  const [width, setWidth] = useState("4,50");
  const [length, setLength] = useState("4,00");
  const [pattern, setPattern] = useState("");
  const cfg = MODES[mode];

  const w = parse(width);
  const l = parse(length);
  const valid = cfg.input === "width" ? w > 0 : w > 0 && l > 0;
  const result = useMemo(() => (valid ? compute(mode, w, l) : null), [mode, w, l, valid]);

  const message = result
    ? `Olá! Fiz o cálculo no site da Mercatto Decor: ${cfg.product}${pattern ? ` ${pattern}` : ""}, ${result.summary}. Gostaria de confirmar a quantidade e solicitar um orçamento.`
    : undefined;

  const field = "mt-2 w-full border border-ink/25 bg-paper px-4 py-3 text-base text-ink focus:border-copper focus:outline-none";

  return (
    <form className="bg-paper p-6 shadow-[0_30px_60px_-30px_rgba(43,39,36,0.35)] md:p-10" onSubmit={(e) => e.preventDefault()} aria-labelledby={`${uid}-t`}>
      <p className="eyebrow text-copper-deep">Calculadora</p>
      <h3 id={`${uid}-t`} className="mt-3 font-serif text-3xl">
        Quanto material o seu ambiente pede?
      </h3>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <label className="block text-xs font-medium uppercase tracking-[0.14em] text-ink-soft sm:col-span-2">
          Produto
          <select
            className={field}
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as Mode);
              setPattern("");
            }}
          >
            {(Object.keys(MODES) as Mode[]).map((m) => (
              <option key={m} value={m}>
                {MODES[m].label}
              </option>
            ))}
          </select>
        </label>

        {cfg.input === "area" && (
          <label className="block text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">
            Comprimento (m)
            <input className={field} inputMode="decimal" value={length} onChange={(e) => setLength(e.target.value)} />
          </label>
        )}
        <label className={`block text-xs font-medium uppercase tracking-[0.14em] text-ink-soft ${cfg.input === "width" ? "sm:col-span-2" : ""}`}>
          {cfg.input === "width" ? "Largura da parede (m)" : "Largura (m)"}
          <input className={field} inputMode="decimal" value={width} onChange={(e) => setWidth(e.target.value)} />
        </label>

        {cfg.patterns.length > 0 && (
          <label className="block text-xs font-medium uppercase tracking-[0.14em] text-ink-soft sm:col-span-2">
            Padrão <span className="normal-case tracking-normal text-stone">(opcional)</span>
            <select className={field} value={pattern} onChange={(e) => setPattern(e.target.value)}>
              <option value="">Ainda não escolhi</option>
              {cfg.patterns.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-8 border-t border-ink/15 pt-6" aria-live="polite">
        {result ? (
          <>
            <p className="text-xs uppercase tracking-[0.16em] text-stone">Estimativa</p>
            <p className="mt-1 font-serif text-5xl text-ink">{result.main}</p>
            <p className="mt-2 text-sm text-ink-soft">{result.detail}</p>
          </>
        ) : (
          <p className="text-sm text-stone">Informe as medidas em metros (ex.: 4,50).</p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-stone">{cfg.note}</p>
      </div>

      <a
        href={whatsappUrl(message)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-copper mt-8 w-full whitespace-normal text-center"
      >
        <WhatsAppIcon className="h-4 w-4" />
        {result ? "Enviar cálculo e solicitar orçamento" : "Solicitar orçamento"}
      </a>
    </form>
  );
}
