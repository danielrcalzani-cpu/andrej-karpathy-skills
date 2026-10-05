import Reveal from "./Reveal";

// Benefícios conforme os catálogos — cada um indica em quais linhas ele vale.
const benefits = [
  {
    title: "Sem demolição",
    text: "A placa é colada sobre a parede existente, desde que limpa, seca e nivelada. Sem rejunte e com pouca sujeira.",
    lines: ["Château Mur", "Placas flexíveis"],
  },
  {
    title: "Grandes formatos, menos emendas",
    text: "Uma placa Château Mur cobre 2,58 m² e vai do rodapé ao teto em paredes de até 2,80 m. A placa flexível tem 2,90 × 1,22 m.",
    lines: ["Château Mur", "Placas flexíveis"],
  },
  {
    title: "Fino no chão",
    text: "Com 2 ou 3 mm, o piso vinílico colado quase não altera o nível: portas e rodapés pedem menos ajustes.",
    lines: ["Piso colado"],
  },
  {
    title: "Encaixe sem cola",
    text: "Réguas unidas pelo clique Uniclic com ClickControl: o ambiente volta ao uso logo após a instalação.",
    lines: ["Piso SPC"],
  },
  {
    title: "Água e umidade",
    text: "O SPC é à prova d’água e vai a cozinhas e lavanderias. Château Mur e placas flexíveis resistem à água e podem ir a áreas úmidas.",
    lines: ["Piso SPC", "Château Mur", "Placas flexíveis"],
  },
  {
    title: "Conforto e silêncio",
    text: "Mais confortável e silencioso que a cerâmica, sem a sensação de chão frio. No SPC, a manta acústica Vexa abafa os passos; na parede, o Château Mur traz conforto térmico e acústico.",
    lines: ["Piso colado", "Piso SPC", "Château Mur"],
  },
  {
    title: "Acompanha curvas",
    text: "A placa de fibra de bambu pode ser dobrada e moldada, acompanhando cantos e curvas da parede.",
    lines: ["Placas flexíveis"],
  },
  {
    title: "Manutenção simples",
    text: "Pano úmido e detergente neutro resolvem a limpeza do dia a dia. Nada de rejunte para limpar.",
    lines: ["Pisos vinílicos", "Château Mur", "Placas flexíveis"],
  },
];

const comparison = [
  { label: "Obra", a: "Colagem sobre a superfície existente", b: "Demolição do revestimento antigo" },
  { label: "Emendas", a: "Uma placa cobre 2,58 m²", b: "Muitas peças e rejunte" },
  { label: "Sujeira", a: "Instalação limpa e seca", b: "Entulho, água e poeira" },
  { label: "Toque", a: "Conforto térmico e acústico", b: "Superfície fria e dura" },
  { label: "Manutenção", a: "Pano úmido e detergente neutro", b: "Limpeza de rejunte" },
];

export default function BenefitsSection() {
  return (
    <section id="beneficios" aria-labelledby="beneficios-title" className="bg-paper py-16 md:py-36">
      <div className="container-x grid gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <p className="eyebrow text-copper-deep">
                Por que Mercatto
              </p>
              <h2 id="beneficios-title" className="display mt-5 text-[2.35rem] sm:text-5xl lg:text-[3.6rem]">
                Transformação <em>sem quebra-quebra.</em>
              </h2>
              <p className="mt-6 max-w-md leading-relaxed text-ink-soft">
                Cada linha resolve a reforma de um jeito. Abaixo, o que os catálogos garantem — e onde cada vantagem se aplica.
              </p>
            </Reveal>

            <Reveal delay={150} className="mt-10">
              <table className="w-full border-collapse text-left text-sm">
                <caption className="eyebrow mb-4 text-left text-stone">Château Mur × revestimento tradicional</caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Critério</th>
                    <th scope="col">Château Mur</th>
                    <th scope="col">Revestimento tradicional</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row) => (
                    <tr key={row.label} className="border-t border-ink/15 align-top">
                      <th scope="row" className="w-24 py-3 pr-3 text-xs font-medium uppercase tracking-[0.14em] text-stone">
                        {row.label}
                      </th>
                      <td className="py-3 pr-3 text-ink">{row.a}</td>
                      <td className="py-3 text-stone line-through decoration-ink/20">{row.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          </div>
        </div>

        <ol className="lg:col-span-7 lg:col-start-6">
          {benefits.map((b) => (
            <Reveal as="li" key={b.title} className="border-t border-ink/15 py-8 md:py-10">
              <div>
                <h3 className="font-serif text-2xl md:text-[2rem] md:leading-tight">{b.title}</h3>
                <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">{b.text}</p>
                <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-[0.14em] text-copper-deep">
                  {b.lines.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
