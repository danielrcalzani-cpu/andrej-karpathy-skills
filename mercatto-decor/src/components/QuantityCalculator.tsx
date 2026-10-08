import { WhatsAppIcon } from "./Icons";
import LiveCalc from "./LiveCalc";
import { CALC_MODES, CALC_ORDER, calcMessage, calculate } from "@/lib/calc";
import { whatsappUrl } from "@/lib/whatsapp";

/**
 * Calculadora da "tabela rápida" dos catálogos, em HTML + CSS (rádios + :has), para
 * funcionar também onde JavaScript não roda (ex.: pré-visualização de arquivos do iPhone).
 * Onde há JavaScript, <LiveCalc> acrescenta o cálculo com medida exata.
 */
const DEFAULT_PRODUCT = CALC_ORDER[0];
const defaultMeasure = (n: number) => Math.min(2, n - 1);

// Regras de exibição geradas a partir dos ids (o CSS não liga rádio ↔ painel sozinho).
const rules = CALC_ORDER.map((mode) => {
  const p = `#calc-p-${mode}`;
  const cfg = CALC_MODES[mode];
  const measures = cfg.quick
    .map((_, i) => {
      const m = `#calc-m-${mode}-${i}`;
      return `.calc:has(${m}:checked) [data-r="${mode}-${i}"]{display:block}
.calc:has(${m}:checked) label[for="calc-m-${mode}-${i}"]{background:var(--color-ink);color:var(--color-paper);border-color:var(--color-ink)}
.calc:has(${m}:focus-visible) label[for="calc-m-${mode}-${i}"]{outline:2px solid var(--color-copper);outline-offset:2px}`;
    })
    .join("\n");
  return `.calc:has(${p}:checked) [data-p="${mode}"]{display:block}
.calc:has(${p}:checked) label[for="calc-p-${mode}"]{background:var(--color-copper);color:#fff;border-color:var(--color-copper)}
.calc:has(${p}:focus-visible) label[for="calc-p-${mode}"]{outline:2px solid var(--color-ink);outline-offset:2px}
${measures}`;
}).join("\n");

const chip = "flex min-h-11 cursor-pointer items-center justify-center border border-ink/25 px-3 py-2 text-center text-sm transition-colors hover:border-ink";

export default function QuantityCalculator() {
  return (
    <div className="calc bg-paper p-6 shadow-[0_30px_60px_-30px_rgba(43,39,36,0.35)] md:p-10">
      <style>{`.calc-panel,.calc-res{display:none}\n${rules}`}</style>
      <p className="eyebrow text-copper-deep">Calculadora</p>
      <h3 className="mt-3 font-serif text-3xl">Quanto material o seu ambiente pede?</h3>

      <fieldset className="mt-7">
        <legend className="text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">1. Produto</legend>
        {CALC_ORDER.map((mode) => (
          <input
            key={mode}
            type="radio"
            name="calc-produto"
            id={`calc-p-${mode}`}
            defaultChecked={mode === DEFAULT_PRODUCT}
            className="sr-only"
          />
        ))}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CALC_ORDER.map((mode) => (
            <label key={mode} htmlFor={`calc-p-${mode}`} className={chip}>
              {CALC_MODES[mode].label}
            </label>
          ))}
        </div>
      </fieldset>

      {CALC_ORDER.map((mode) => {
        const cfg = CALC_MODES[mode];
        const unit = cfg.input === "width" ? "m" : "m²";
        return (
          <section key={mode} data-p={mode} className="calc-panel mt-8" aria-label={`Cálculo — ${cfg.product}`}>
            <p className="font-serif text-xl text-ink">{cfg.formula}</p>

            <fieldset className="mt-6">
              <legend className="text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">
                2. {cfg.input === "width" ? "Largura da parede" : "Área do ambiente"}{" "}
                <span className="normal-case tracking-normal text-stone">(tabela rápida do catálogo)</span>
              </legend>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {cfg.quick.map((q, i) => (
                  <span key={q} className="contents">
                    <input
                      type="radio"
                      name={`calc-m-${mode}`}
                      id={`calc-m-${mode}-${i}`}
                      defaultChecked={i === defaultMeasure(cfg.quick.length)}
                      className="sr-only"
                    />
                    <label htmlFor={`calc-m-${mode}-${i}`} className={chip}>
                      {q} {unit}
                    </label>
                  </span>
                ))}
              </div>
            </fieldset>

            {cfg.quick.map((q, i) => {
              const r = calculate(mode, q);
              return (
                <div key={q} data-r={`${mode}-${i}`} className="calc-res mt-6 border-t border-ink/15 pt-6">
                  <p className="text-xs uppercase tracking-[0.16em] text-stone">
                    {cfg.input === "width" ? `Parede de ${q} m de largura` : `Ambiente de ${q} m²`}
                  </p>
                  <p className="mt-1 font-serif text-5xl text-ink">{r.main}</p>
                  <p className="mt-2 text-sm text-ink-soft">{r.detail}</p>
                  <a
                    href={whatsappUrl(calcMessage(mode, r))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-copper mt-6 w-full whitespace-normal text-center"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Enviar cálculo e solicitar orçamento
                  </a>
                </div>
              );
            })}

            <p className="mt-5 text-xs leading-relaxed text-stone">{cfg.note}</p>
            {cfg.patterns.length > 0 && (
              <p className="mt-3 hidden text-xs leading-relaxed text-ink-soft md:block">
                <span className="font-medium text-copper-deep">Padrões: </span>
                {cfg.patterns.join(" · ")}
              </p>
            )}

            <LiveCalc mode={mode} />
          </section>
        );
      })}
    </div>
  );
}
