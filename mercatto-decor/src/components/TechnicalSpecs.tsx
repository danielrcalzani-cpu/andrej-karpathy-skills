import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

// Fichas técnicas dos catálogos, lado a lado. "Sob consulta" = o catálogo não informa.
const columns = ["Piso vinílico colado", "Piso vinílico SPC", "Placas flexíveis", "Château Mur", "Teto laminado"];

const rows: { label: string; values: string[] }[] = [
  {
    label: "Formato",
    values: ["Réguas · 18,4 × 95 cm na Paesaggi; demais sob consulta", "Régua 0,23 × 1,40 m · 0,322 m²", "2,90 × 1,22 m · 3,54 m² (Caliza: 2,75 × 1,20 m · 3,30 m²)", "2,80 × 0,92 m · 2,58 m²", "Sob consulta"],
  },
  { label: "Espessura", values: ["2 mm · 3 mm no Toscana", "Sob consulta", "3 mm", "2 mm", "Sob consulta"] },
  { label: "Capa de uso", values: ["0,15 mm (Nobiltà) · 0,20 mm (Paesaggi e Realeza) · 0,30 mm (Sole)", "0,30 mm (Serras) · 0,50 mm (Freijó)", "Filme laminado de PVC", "Filme de proteção anti-riscos", "Acabamento amadeirado"] },
  { label: "Instalação", values: ["Colada sobre o contrapiso nivelado, sem argamassa", "Clique Uniclic com ClickControl, sem cola", "Colada sobre a parede limpa, seca e firme", "Colada sobre a parede existente, limpa, seca e nivelada", "Sob consulta"] },
  { label: "Água", values: ["Resiste a respingos; evite água parada", "À prova d’água", "Indicada também para áreas úmidas", "Resistente à água e à umidade", "—"] },
  { label: "Uso", values: ["Residencial · ambientes internos", "Residencial intenso e comercial geral", "Ambientes internos", "Ambientes internos, inclusive úmidos", "Salas, quartos, recepções e espaços comerciais"] },
  { label: "Limpeza", values: ["Pano úmido e detergente neutro", "Pano úmido e detergente neutro", "Pano macio levemente úmido; sabão neutro", "Pano úmido e detergente neutro", "Espanador ou pano macio e seco"] },
  { label: "Padrões", values: ["14", "4", "11", "5 + 2 Coronato + 2 madeiras", "7"] },
];

export default function TechnicalSpecs() {
  return (
    <section id="tecnico" aria-labelledby="tecnico-title" className="bg-paper py-24 md:py-36">
      <div className="container-x">
        <SectionHeading
          id="tecnico-title"
          index="08"
          eyebrow="Ficha técnica"
          title={
            <>
              O que está <em>por trás</em> da superfície.
            </>
          }
          intro="Os dados essenciais de cada linha, direto das fichas técnicas. Para medidas e embalagens “sob consulta”, nossa equipe confirma no orçamento."
        />

        <Reveal className="mt-14">
          <div className="no-scrollbar -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0" role="region" aria-label="Tabela de especificações (role para o lado no celular)" tabIndex={0}>
            <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
              <caption className="sr-only">Especificações técnicas por linha de produto</caption>
              <thead>
                <tr className="border-b border-ink">
                  <th scope="col" className="w-36 py-4 pr-4 text-xs font-medium uppercase tracking-[0.16em] text-stone">
                    <span className="sr-only">Característica</span>
                  </th>
                  {columns.map((c) => (
                    <th key={c} scope="col" className="py-4 pr-6 align-bottom font-serif text-lg font-normal leading-tight">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b border-ink/15 align-top">
                    <th scope="row" className="py-4 pr-4 text-xs font-medium uppercase tracking-[0.16em] text-copper-deep">
                      {r.label}
                    </th>
                    {r.values.map((v, i) => (
                      <td key={i} className={`py-4 pr-6 leading-relaxed ${v === "Sob consulta" || v === "—" ? "text-stone" : "text-ink-soft"}`}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-stone">
            Informações conforme o material do fabricante, sujeitas a alteração sem aviso prévio. Château Mur: matéria-prima 100% virgem,
            sem metais pesados ou Bisfenol A; norma REACH – ECHA; testes e ensaios conforme a ABNT NBR 14917. Garantia e quantidade por
            caixa: consulte a Mercatto Decor.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
