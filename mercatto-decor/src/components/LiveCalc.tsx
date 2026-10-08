"use client";

import { useState } from "react";
import { WhatsAppIcon } from "./Icons";
import { CALC_MODES, calcMessage, calculate, type CalcMode } from "@/lib/calc";
import { whatsappUrl } from "@/lib/whatsapp";

const parse = (v: string) => {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const field = "mt-2 w-full border border-ink/25 bg-paper px-4 py-3 text-base text-ink focus:border-copper focus:outline-none";
const lbl = "block text-xs font-medium uppercase tracking-[0.14em] text-ink-soft";

/** Cálculo com medida exata (só aparece onde há JavaScript; sem JS fica a tabela rápida). */
export default function LiveCalc({ mode }: { mode: CalcMode }) {
  const cfg = CALC_MODES[mode];
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");
  const [pattern, setPattern] = useState("");

  const w = parse(width);
  const l = parse(length);
  const value = cfg.input === "width" ? w : w * l;
  const result = value > 0 ? calculate(mode, value) : null;

  return (
    <div className="calc-live mt-8 border-t border-ink/15 pt-6">
      <p className="eyebrow text-copper-deep">Outra medida</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {cfg.input === "area" && (
          <label className={lbl}>
            Comprimento (m)
            <input className={field} inputMode="decimal" placeholder="ex.: 4,00" value={length} onChange={(e) => setLength(e.target.value)} />
          </label>
        )}
        <label className={`${lbl} ${cfg.input === "width" ? "sm:col-span-2" : ""}`}>
          {cfg.input === "width" ? "Largura da parede (m)" : "Largura (m)"}
          <input className={field} inputMode="decimal" placeholder={cfg.input === "width" ? "ex.: 4,50" : "ex.: 3,00"} value={width} onChange={(e) => setWidth(e.target.value)} />
        </label>
        {cfg.patterns.length > 0 && (
          <label className={`${lbl} sm:col-span-2`}>
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

      <div aria-live="polite" className="mt-5">
        {result ? (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-serif text-4xl text-ink">{result.main}</p>
              <p className="mt-1 text-sm text-ink-soft">{result.detail}</p>
            </div>
            <a
              href={whatsappUrl(calcMessage(mode, result, pattern || undefined))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-copper whitespace-normal text-center"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Enviar este cálculo
            </a>
          </div>
        ) : (
          <p className="text-sm text-stone">Informe a medida em metros para calcular na hora.</p>
        )}
      </div>
    </div>
  );
}
