import Reveal from "./Reveal";
import { products } from "@/data/products";
import { families } from "@/data/collections";

// Números reais, calculados a partir dos dados dos catálogos.
const facts = [
  { value: String(products.length), unit: "padrões", text: "entre madeiras, mármores, pedras, linhos e efeitos especiais" },
  { value: String(families.length), unit: "linhas de produto", text: "para piso, parede e teto, cada uma com seu catálogo" },
  { value: "2,80", unit: "metros", text: "de altura em uma única placa Château Mur: do rodapé ao teto" },
  { value: "2", unit: "milímetros", text: "de espessura no piso vinílico colado: quase não altera o nível" },
];

export default function FactsBand() {
  return (
    <section id="numeros" aria-label="Mercatto Decor em números" className="border-b border-ink/10 bg-paper">
      <div className="container-x grid grid-cols-2 lg:grid-cols-4">
        {facts.map((f, i) => (
          <Reveal
            key={f.unit}
            delay={i * 90}
            className={`py-10 pr-4 md:py-14 ${i % 2 === 1 ? "pl-5 md:pl-8" : ""} ${i > 0 ? "lg:pl-8" : ""} ${
              i % 2 === 1 ? "border-l border-ink/10" : ""
            } ${i === 2 ? "border-t border-ink/10 lg:border-l lg:border-t-0" : ""} ${i === 3 ? "border-t border-ink/10 lg:border-t-0" : ""}`}
          >
            <p className="flex items-baseline gap-2">
              <span className="font-serif text-5xl leading-none text-ink md:text-6xl">{f.value}</span>
              <span className="eyebrow text-copper-deep">{f.unit}</span>
            </p>
            <p className="mt-4 max-w-[15rem] text-sm leading-relaxed text-ink-soft">{f.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
