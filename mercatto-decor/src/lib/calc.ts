// Regras de cálculo dos catálogos Mercatto Decor (edição 2026), em um só lugar.
import { products } from "@/data/products";

export type CalcMode = "chateau" | "placas" | "caliza" | "piso-colado" | "piso-spc" | "teto";

type ModeConfig = {
  label: string;
  /** nome usado na mensagem de WhatsApp */
  product: string;
  input: "width" | "area";
  formula: string;
  note: string;
  /** medidas da "tabela rápida" do catálogo (m de largura ou m² de área) */
  quick: number[];
  patterns: string[];
};

export const CALC_MODES: Record<CalcMode, ModeConfig> = {
  chateau: {
    label: "Château Mur",
    product: "Château Mur",
    input: "width",
    formula: "Largura da parede ÷ 0,92 m",
    note: "Válido para paredes com até 2,80 m de altura. Com portas, janelas ou muitos recortes, considere uma placa extra. Cada caixa traz 02 placas (5,16 m²).",
    quick: [2, 3, 4, 5, 6, 7, 8, 10],
    patterns: products.filter((p) => p.collection === "Coleção Château Mur").map((p) => `${p.name} (cód. ${p.code})`),
  },
  placas: {
    label: "Placas flexíveis",
    product: "Placa de revestimento flexível",
    input: "width",
    formula: "Largura da parede ÷ 1,22 m",
    note: "Arredonde sempre para cima. Válido para paredes com até 2,90 m de altura. Com portas, janelas ou muitos recortes, considere uma placa extra.",
    quick: [2, 3, 4, 5, 6, 7, 8, 10],
    patterns: products.filter((p) => p.family === "placas" && p.code !== "295").map((p) => `${p.name} (cód. ${p.code})`),
  },
  caliza: {
    label: "Placa Caliza",
    product: "Placa Vinílica Caliza (cód. 295)",
    input: "width",
    formula: "Largura da parede ÷ 1,20 m",
    note: "Arredonde sempre para cima. Válido para paredes com até 2,75 m de altura.",
    quick: [2, 3, 4, 5, 6, 7, 8, 10],
    patterns: [],
  },
  "piso-colado": {
    label: "Piso colado",
    product: "Piso vinílico colado",
    input: "area",
    formula: "Comprimento × largura × 1,10",
    note: "Some 10% para recortes e perdas. Em ambientes com muitos recortes, colunas ou paginação em diagonal, considere uma margem maior. A quantidade de m² por caixa é informada no orçamento.",
    quick: [5, 10, 12, 15, 20, 25, 30, 40, 50],
    patterns: products.filter((p) => p.family === "piso-colado").map((p) => `${p.name} (${p.collection})`),
  },
  "piso-spc": {
    label: "Piso SPC",
    product: "Piso vinílico SPC",
    input: "area",
    formula: "Área × 1,10 ÷ 0,322 m² por régua",
    note: "Some 10% para recortes e perdas e arredonde para cima. Em ambientes com muitos recortes, colunas ou instalação em diagonal, considere uma margem maior. A quantidade de réguas por caixa é informada no orçamento.",
    quick: [5, 10, 12, 15, 20, 25, 30, 40, 50],
    patterns: products.filter((p) => p.family === "piso-spc").map((p) => `${p.name} (${p.collection})`),
  },
  teto: {
    label: "Teto laminado",
    product: "Teto laminado",
    input: "area",
    formula: "Comprimento × largura × 1,10",
    note: "Acrescente 10% para recortes e perdas. Em tetos com muitos recortes, sancas, vigas ou paginação diagonal, considere uma margem maior. A quantidade por caixa é informada no orçamento.",
    quick: [6, 9, 12, 15, 20, 30],
    patterns: products.filter((p) => p.family === "teto").map((p) => `${p.name} (${p.collection.toLowerCase()})`),
  },
};

export const CALC_ORDER: CalcMode[] = ["chateau", "placas", "caliza", "piso-colado", "piso-spc", "teto"];

export const fmt = (n: number, d = 2) => n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtMeasure = (n: number) => (Number.isInteger(n) ? String(n) : fmt(n));
const ceil = (n: number) => Math.ceil(n - 1e-9);

export type CalcResult = { main: string; detail: string; summary: string };

/** `value` é a largura da parede (m) ou a área do ambiente (m²), conforme o modo. */
export function calculate(mode: CalcMode, value: number): CalcResult {
  const v = fmtMeasure(value);
  switch (mode) {
    case "chateau": {
      const plates = ceil(value / 0.92);
      const boxes = ceil(plates / 2);
      return { main: `${plates} placas`, detail: `${boxes} caixas · ${fmt(boxes * 5.16)} m² nas caixas`, summary: `parede de ${v} m de largura → ${plates} placas (${boxes} caixas)` };
    }
    case "placas": {
      const plates = ceil(value / 1.22);
      return { main: `${plates} placas`, detail: `${fmt(plates * 3.54)} m² de revestimento`, summary: `parede de ${v} m de largura → ${plates} placas` };
    }
    case "caliza": {
      const plates = ceil(value / 1.2);
      return { main: `${plates} placas`, detail: `${fmt(plates * 3.3)} m² de revestimento`, summary: `parede de ${v} m de largura → ${plates} placas` };
    }
    case "piso-spc": {
      const withLoss = value * 1.1;
      const boards = ceil(withLoss / 0.322);
      return { main: `${boards} réguas`, detail: `${v} m² + 10% = ${fmt(withLoss)} m²`, summary: `ambiente de ${v} m² → ${fmt(withLoss)} m² com perdas → ${boards} réguas` };
    }
    default: {
      const withLoss = value * 1.1;
      return { main: `${fmt(withLoss)} m²`, detail: `${v} m² + 10% para recortes e perdas`, summary: `ambiente de ${v} m² → ${fmt(withLoss)} m² a comprar` };
    }
  }
}

export function calcMessage(mode: CalcMode, result: CalcResult, pattern?: string): string {
  const name = CALC_MODES[mode].product + (pattern ? ` ${pattern}` : "");
  return `Olá! Fiz o cálculo no site da Mercatto Decor: ${name}, ${result.summary}. Gostaria de confirmar a quantidade e solicitar um orçamento.`;
}
